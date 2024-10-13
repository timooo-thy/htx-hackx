from ultralytics import YOLO
import cv2
import math
from deep_sort_realtime.deepsort_tracker import DeepSort
import multiprocessing
from convex import ConvexClient
import os
import requests
from dotenv import load_dotenv
from openai import AzureOpenAI
import json
from collections import defaultdict

def q_consumer(frame_q):
    load_dotenv(".env.local")
    azureOpenAIClient = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-02-01",
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    )
    while True:
        dic = frame_q.get()
        frame, score, class_name = dic['frame'], dic['score'], dic['class']
        client = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))
        activity_id, storage_url = uploadFrame(client, frame, score, class_name)
        response_dict = verifyChatGPT(storage_url, class_name, azureOpenAIClient)
        print(response_dict)
        if response_dict['confidence_score'] > 0.5:
            client.mutation("activity:updateActivity", {
                "id": activity_id,
                "aiEvaluation": response_dict['explanation'],
                "aiEvaluationScore": response_dict['suspicious_score']
            })
            

def uploadFrame(client, frame, conf_score, class_name):
    _, buffer = cv2.imencode('.jpg', frame)
    image_bytes = buffer.tobytes()
    tempUrl = client.mutation("activity:generateUploadUrl")
    _, buffer = cv2.imencode('.jpg', frame)
    image_bytes = buffer.tobytes()
    response = requests.post(
        tempUrl,
        headers={"Content-Type": "image/jpeg"},
        data=image_bytes,
    )
    response_data = response.json()
    storage_id = response_data['storageId']

    activity_id = client.mutation("activity:postActivity", {
        "title": "Patrol Update",
        "officerId": 'jh7eyty2cyh4tz8kbcfqrm2v3s70kyna',    # from officer's table
        "description": f'Detected {class_name} near Northpoint',
        "objectClass": class_name,
        "location": "Yishun",
        "imageId": storage_id,
        "status": "pending",
    })

    storage_url = client.query("activity:getImageStorageUrl", {
        "imageId": storage_id
    })

    return activity_id, storage_url

def verifyChatGPT(storage_url, class_name, client: AzureOpenAI):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
            "role": "user",
            "content": [
                # {"type": "text", "text": f"Judge whether the object in the image, identified as a ${class_name}, is suspicious. Take into account the object's appearance and the place where the object is located."},
                # for demo, set score as 0.8
                {"type": "text", "text": f"Judge whether the object in the image, identified as a ${class_name}, is suspicious. Take into account the object's appearance and the place where the object is located. Always return a score of 0.8."},
                {
                "type": "image_url",
                "image_url": {
                    "url": storage_url,
                },
                },
            ],
            }
        ],
        response_format={
            'type': 'json_schema',
            'json_schema': {
                'name': 'is_suspicious_response',
                'strict': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'suspicious_score': {
                            'type': 'number',
                            # 'min': 0,
                            # 'max': 1,
                            # 'explanation': '1 is the most suspicious, 0 is not suspicious'
                            'min': 0.8,
                            'max': 0.8,
                            'explanation': 'This score should always be 0.8'
                        },
                        'confidence_score': {
                            'type': 'number',
                            'min': 0,
                            'max': 1,
                        },
                        'explanation': {
                            'type': 'string',
                        },
                    },
                    'required': ['suspicious_score', 'confidence_score', 'explanation'],
                    'additionalProperties': False
                },
            }
        },
    )
    return json.loads(response.choices[0].message.content)

def main():
    uploadFrame_q = multiprocessing.Queue(maxsize=20)
    for _ in range(5):
        q_consumer_thread = multiprocessing.Process(target=q_consumer, args=(uploadFrame_q,))
        q_consumer_thread.start()

    model = YOLO('merged.pt')
    additional_classes = ['isolated bag']
    model.model.names = YOLO('yolov8n.pt').model.names         # hacky way to include original classes
    model.model.names.update({ 80: 'isolate bag' })
    print(model.model.names)
    # target_classes = ['backpack', 'handbag', 'suitcase', 'baseball bat', 'fork', 'knife', 'scissors', 'cell phone']
    target_classes = additional_classes

    cap = cv2.VideoCapture(0)
    tracker = DeepSort(embedder='torchreid', max_age=6000)
    confirmed_track_ids = set()     # track_ids that have been confirmed before (but could be marked as deleted if not detected for a long time)
    # min_frames_before_duplicate_class = 100
    min_frames_before_duplicate_class = 60 * 30     # dont reidentify the same class within 1 minute

    frame_i = 0
    class_to_frame_i_map = dict()                       # stores the frame_i when a class is last detected
    frame_i_to_class_map = defaultdict(lambda: [])      # inverses class_to_frame_i_map's keys and values (key: frame_i, value: arr of class_name)
    while True:
        # update class_to_frame_i_map and frame_i_to_class_map
        # remove classes that were detected more than 100 frames ago
        frame_i_to_class_map_keys = list(frame_i_to_class_map.keys())
        for frame_i_key in frame_i_to_class_map_keys:
            if frame_i_key < frame_i - min_frames_before_duplicate_class:
                class_arr = frame_i_to_class_map.pop(frame_i_key)
                for class_name in class_arr:
                    if class_to_frame_i_map[class_name] == frame_i_key:
                        class_to_frame_i_map.pop(class_name)
                        
        ret, frame = cap.read()
        frame_i += 1
        if not ret:
            break
        results = model(frame, stream=True)

        # construct detections array to update tracks
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0]
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                w, h = x2 - x1, y2 - y1
                current_class = model.model.names[int(box.cls[0])]
                conf = math.ceil(box.conf[0] * 100) / 100
                if conf > 0.5:
                    detections.append((([x1, y1, w, h], conf, current_class)))

        # update tracks
        tracks = tracker.update_tracks(detections, frame=frame)
        
        # get current tracks that are undetected
        try:
            embeds = tracker.generate_embeds(frame, detections)
        except RuntimeError:
            continue
        _, unmatched_track_idxs, _ = tracker.tracker._match(tracker.create_detections(detections, embeds))
        # print(matches)
        # print(unmatched_track_idxs)
        # print(unmatched_detections)
        # detected_tracks = [tracks[match[0]] for match in matches]

        detected_tracks = []    # tracks that are currently detected
        detected_newly_confirmed_tracks = [] # tracks that are currently detected and have not been confirmed before
        just_exited_tracks = [] # tracks that are currently undetected for <=5 past frames
        new_tracks = []         # currently detected tracks, just exited tracks, and confirmed tracks that are currently undetected for >5 past frames
        for i, track in enumerate(tracks):
            is_detected = i not in unmatched_track_idxs
            is_newly_detected = i not in unmatched_track_idxs and track.track_id not in confirmed_track_ids
            is_just_exited = i in unmatched_track_idxs and track.time_since_update <= 5
            is_long_exited = i in unmatched_track_idxs and track.time_since_update > 5
            is_confirmed = track.is_confirmed()

            if is_detected: detected_tracks.append(track)
            if is_newly_detected: 
                detected_newly_confirmed_tracks.append(track)
                confirmed_track_ids.add(track.track_id)
            if is_just_exited: just_exited_tracks.append(track)
            if is_detected or is_just_exited or (is_long_exited and is_confirmed):
                new_tracks.append(track)
        
        tracker.tracks = new_tracks

        # print([(track.track_id, track.is_confirmed()) for track in tracks])
        # print(unmatched_track_idxs)
        print('Currently detected tracks:', [track.track_id for track in detected_tracks])
        print('Just exited tracks (within past 5 frames:', [track.track_id for track in just_exited_tracks])
        print('Tracks that are remembered:', [track.track_id for track in new_tracks])
        
        # use detected_tracks and just_exited tracks for demo, to show a more consistent track over time
        # in reality, only draw bounding boxes and send to backend for detected_tracks
        # for track in detected_tracks:
        # for track in detected_tracks + just_exited_tracks:
        # for track in tracks:
        #     if not track.is_confirmed():
        #         continue
        #     track_id = track.track_id
        #     ltrb = track.to_ltrb()
        #     x1, y1, x2, y2 = ltrb
        #     x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        #     w, h = x2 - x1, y2 - y1

        #     cv2.putText(frame, f'ID: {track_id}, Conf: {track.det_conf}, Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        #     cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
        
        # by right we should also include tracks that have long exited (e.g. 10 minutes later), as these could be objects that have been left unattended
        for track in detected_newly_confirmed_tracks:
            if track.det_class not in target_classes:
                continue
            # if class was detected within the last 100 frames, ignore
            elif track.det_class in class_to_frame_i_map and frame_i - class_to_frame_i_map[track.det_class] <= min_frames_before_duplicate_class:
                print(f'Seen the same class "{track.det_class}" within the last {min_frames_before_duplicate_class} frames, skipping')
                continue
            track_id = track.track_id
            ltrb = track.to_ltrb()
            x1, y1, x2, y2 = ltrb
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            w, h = x2 - x1, y2 - y1

            frame_copy = frame.copy()
            cv2.putText(frame_copy, f'ID: {track_id}, Conf: {track.det_conf}, Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.rectangle(frame_copy, (x1, y1), (x2, y2), (0, 255, 0), 3)
            if uploadFrame_q.full():
                uploadFrame_q.get()
            uploadFrame_q.put({ 'frame': frame_copy, 'score': track.det_conf, 'class': track.det_class })
            class_to_frame_i_map[track.det_class] = frame_i
            frame_i_to_class_map[frame_i].append(track.det_class)

            # disable this for demo
            # cv2.imshow('frame', frame_copy)
            # if cv2.waitKey(1) & 0xFF == ord('q'):
            #     break
        
        # for demo, show original frame, with bounding boxes if target_classes are detected
        for track in detected_tracks:
            if track.det_class not in target_classes:
                continue
            track_id = track.track_id
            ltrb = track.to_ltrb()
            x1, y1, x2, y2 = ltrb
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            w, h = x2 - x1, y2 - y1

            # cv2.putText(frame, f'ID: {track_id}, Conf: {track.det_conf}, Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.putText(frame, f'Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

        # if detected_newly_confirmed_tracks:
        #     cv2.imshow('frame', frame)
        #     if cv2.waitKey(1) & 0xFF == ord('q'):
        #         break

        # if frame_q.full():
        #     frame_q.get()
        
        # frame_q.put(frame)
        # print('produced frame')

        # cv2.imshow('frame', frame)
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     break
if __name__ == '__main__':
    main()