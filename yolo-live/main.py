from ultralytics import YOLO
import cv2
import math
from deep_sort_realtime.deepsort_tracker import DeepSort
import multiprocessing
from collections import defaultdict
import time
from process_frame import process_frame
from save_frame_locally import save_frame_locally

def main():
    process_frame_q = multiprocessing.Queue(maxsize=20)
    for _ in range(5):
        process_frame_process = multiprocessing.Process(target=process_frame, args=(process_frame_q,))
        process_frame_process.start()

    save_frame_locally_q = multiprocessing.Queue()
    for _ in range(5):
        save_frame_locally_process = multiprocessing.Process(target=save_frame_locally, args=(save_frame_locally_q,))
        save_frame_locally_process.start()

    model = YOLO('./yolo-weights/yolo11l.pt')
    expected_model_fps = 8  # ~8 for yolo11l
    model.model.names.update({ 24: 'isolated bag', 28: 'isolated bag' })    # hacky way to change 'backpack' and 'suitcase' to 'isolated bag'
    print(model.model.names)
    target_classes = [24, 28]

    cap = cv2.VideoCapture(0)

    # note: change line 174 of yolo-live/.venv-3.9/lib/python3.9/site-packages/deep_sort_realtime/embedder/embedder_pytorch.py to:
        # self.gpu = gpu
        # if self.gpu and torch.cuda.is_available():
        #     device = 'cuda'
        # elif self.gpu and torch.backends.mps.is_available():
        #     device = 'mps'
    # the reid tracker sorts tracks into 3 categories
        # tentative/not_confirmed: tracks that have not been detected for n_init frames consecutively
        # confirmed
        # deleted: tracks that have not been detected for max_age frames consecutively
    tracker = DeepSort(embedder='torchreid', max_age=6000, n_init=2, embedder_gpu=True)

    # remember the last frame a class was detected, and ignore duplicate detections of the same class within a certain number of frames
    # TODO: a better implementation would be mapping frame_i to track_id, and ignoring duplicate detections of the same track_id within a certain number of frames
    frame_i = 0
    class_to_frame_i_map = dict()                                       # stores the frame_i when a class is last detected
    frame_i_to_class_map = defaultdict(lambda: [])                      # inverses class_to_frame_i_map's keys and values (key: frame_i, value: arr of class_name)
    confirmed_or_deleted_track_ids = set()                              # track_ids that have been confirmed before (or deleted if not detected for max_age frames)
    min_frames_before_duplicate_class = expected_model_fps * 30         # determines how many frames before the same class can be detected again

    frame_count = 0
    start_time = time.time()
    fps = 0
    while True:
        # update class_to_frame_i_map and frame_i_to_class_map
        # remove classes that were detected more than min_frames_before_duplicate_class frames ago
        frame_i_to_class_map_keys = list(frame_i_to_class_map.keys())
        for frame_i_key in frame_i_to_class_map_keys:
            if frame_i_key < frame_i - min_frames_before_duplicate_class:
                class_arr = frame_i_to_class_map.pop(frame_i_key)
                for class_name in class_arr:
                    if class_to_frame_i_map[class_name] == frame_i_key:
                        class_to_frame_i_map.pop(class_name)
                        
        # get detections from yolo model for current frame
        # allow no overlap between any of the detections' boxes (iou=0), and minimum confidence of 0.5
        ret, frame = cap.read()
        frame_i += 1
        if not ret:
            break
        results = model.predict(frame, verbose=False, device='mps', iou=0, conf=0.5, classes=target_classes)

        # construct detections array from yolo detection results to update reid tracker
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0]
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                w, h = x2 - x1, y2 - y1
                current_class = model.model.names[int(box.cls[0])]
                conf = math.ceil(box.conf[0] * 100) / 100
                detections.append((([x1, y1, w, h], conf, current_class)))
        
        # get idxs of current tracks from reid tracker that are not detected by the yolo model by duplicating code from DeepSort's update_tracks
        if len(detections) > 0:
            assert len(detections[0][0])==4
            raw_detections = [d for d in detections if d[0][2] > 0 and d[0][3] > 0]
            embeds = tracker.generate_embeds(frame, raw_detections)
            generated_detections = tracker.create_detections(raw_detections, embeds)
            _, unmatched_track_idxs, _ = tracker.tracker._match(generated_detections)
            tracker.tracker.predict()
            tracker.tracker.update(generated_detections)
            tracks = tracker.tracks
        else:
            # if no yolo detections, then all reid tracks must be unmatched 
            tracks = tracker.update_tracks(detections, frame=frame)
            unmatched_track_idxs = [i for i in range(len(tracks))]

        # construct the new_tracks array and update reid tracker's tracks to that
        detected_tracks = []    # tracks that are currently detected
        # detected_newly_confirmed_tracks = [] # tracks that are currently detected and are not confirmed
        just_exited_tracks = [] # tracks that are currently undetected for <=3 past frames
        new_tracks = []         # currently detected tracks, just exited tracks, and confirmed tracks that are currently undetected for >3 past frames
        for i, track in enumerate(tracks):
            is_detected = i not in unmatched_track_idxs
            is_newly_detected = i not in unmatched_track_idxs and track.track_id not in confirmed_or_deleted_track_ids
            is_just_exited = i in unmatched_track_idxs and track.time_since_update <= 3
            is_long_exited = i in unmatched_track_idxs and track.time_since_update > 3
            is_confirmed = track.is_confirmed()

            if is_detected: detected_tracks.append(track)
            if is_newly_detected: 
                # detected_newly_confirmed_tracks.append(track)
                confirmed_or_deleted_track_ids.add(track.track_id)
            if is_just_exited: just_exited_tracks.append(track)
            if is_detected or is_just_exited or (is_long_exited and is_confirmed):
                new_tracks.append(track)
        tracker.tracks = new_tracks

        print('YOLO detections:', detections)
        print('Currently detected tracks:', [track.track_id for track in detected_tracks])
        print('Just exited tracks (within past 3 frames):', [track.track_id for track in just_exited_tracks])
        print('Tracks that are remembered by reid tracker:', [track.track_id for track in new_tracks])

        # upload frames to DB, for tracks that are newly confirmed, or confirmed and has not been detected for the past min_frames_before_duplcate_class frames
        for track in detected_tracks:
            # ignore unconfirmed tracks
            if not track.is_confirmed():
                continue
            # if track is confirmed but class has already been detected within the last min_frames_before_duplicate_class frames, ignore
            elif track.det_class in class_to_frame_i_map and frame_i - class_to_frame_i_map[track.det_class] <= min_frames_before_duplicate_class:
                print(f'Seen the same class "{track.det_class}" within the last {min_frames_before_duplicate_class} frames, skipping')
                class_to_frame_i_map[track.det_class] = frame_i
                continue
            track_id = track.track_id
            ltrb = track.to_ltrb()
            x1, y1, x2, y2 = ltrb
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            w, h = x2 - x1, y2 - y1

            frame_copy = frame.copy()
            cv2.putText(frame_copy, f'ID: {track_id}, Conf: {track.det_conf}, Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.rectangle(frame_copy, (x1, y1), (x2, y2), (0, 255, 0), 3)
            if process_frame_q.full():
                process_frame_q.get()
            # TODO: change this when class_to_frame_i_map is changed to class_to_track_id_map
            process_frame_q.put({ 'frame': frame_copy, 'score': track.det_conf, 'class': track.det_class, 'is_id_seen_before': track.det_class in class_to_frame_i_map})
            class_to_frame_i_map[track.det_class] = frame_i
            frame_i_to_class_map[frame_i].append(track.det_class)

        # drawing bounding boxes on frame for demo
        for track in detected_tracks + just_exited_tracks:
            track_id = track.track_id
            ltrb = track.to_ltrb()
            x1, y1, x2, y2 = ltrb
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            w, h = x2 - x1, y2 - y1

            # saving frame locally, potentially can be used for training of reid
            if track in detected_tracks:
                save_frame_locally_q.put({ 'frame': frame, 'coord': [x1, y1, x2, y2], 'track_id': track_id, 'class': track.det_class })

            cv2.putText(frame, f'ID: {track_id}, Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)


        # update FPS every second, and display it on the frame 
        # NOTE: comment this out during actual demo
        frame_count += 1
        elapsed_time = time.time() - start_time
        if elapsed_time >= 1.0:
            fps = frame_count / elapsed_time
            frame_count = 0
            start_time = time.time()
        cv2.putText(frame, str(fps), (frame.shape[1] - 150, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        
        print("\n")

if __name__ == '__main__':
    main()