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
import time
import sys

def calculate_iou(box1, box2):
    """
    Calculate the Intersection over Union (IoU) of two bounding boxes.
    
    Parameters:
    box1, box2: (x_min, y_min, w, h) format for two bounding boxes.
    
    Returns:
    float: IoU value between box1 and box2.
    """
    # Get the coordinates of the intersection box
    x_min_inter = max(box1[0], box2[0])
    y_min_inter = max(box1[1], box2[1])
    x_max_inter = min(box1[0] + box1[2], box2[0] + box2[2])
    y_max_inter = min(box1[1] + box1[3], box2[1] + box2[3])

    # Compute the area of intersection
    inter_width = max(0, x_max_inter - x_min_inter)
    inter_height = max(0, y_max_inter - y_min_inter)
    intersection_area = inter_width * inter_height

    # Compute the area of both bounding boxes
    box1_area = box1[2] * box1[3]  # w * h for box1
    box2_area = box2[2] * box2[3]  # w * h for box2

    # Compute the union area
    union_area = box1_area + box2_area - intersection_area

    # Compute the IoU
    iou = intersection_area / union_area if union_area != 0 else 0

    return iou

def q_consumer(frame_q):
    load_dotenv(".env.local")
    azureOpenAIClient = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-08-01-preview",
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    )
    while True:
        dic = frame_q.get()
        frame, score, class_name = dic['frame'], dic['score'], dic['class']
        client = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))
        activity_id, storage_url = uploadFrame(client, frame, score, class_name)
        # similar_activities_arr = client.action("activity:getSimilarActivities", {"id": activity_id })
        # for demo, set similar_activities_arr to empty array
        similar_activities_arr = []
        response_dict = verifyChatGPT(storage_url, class_name, azureOpenAIClient, similar_activities_arr)
        print(response_dict)
        # for demo, add to DB no matter the confidence score of chatgpt
        # if response_dict['confidence_score'] > 0.5:
        client.mutation("activity:updateActivity", {
            "id": activity_id,
            "aiEvaluation": response_dict['explanation'],
            "aiEvaluationScore": response_dict['suspicious_score']
        })
        client.action("activity:createEmbeddings", {"id": activity_id})
            

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
        "description": f'Detected {class_name} near Frasers Tower',
        "objectClass": class_name,
        "location": "Tanjong Pagar",
        "imageId": storage_id,
        "status": "pending",
    })

    storage_url = client.query("activity:getImageStorageUrl", {
        "imageId": storage_id
    })

    return activity_id, storage_url

def verifyChatGPT(storage_url, class_name, client: AzureOpenAI, similar_activities_arr):
    similar_activites_messages = []
    for similar_activity in similar_activities_arr:
        similar_activites_messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": f"""The following image had been detected as suspicious previously, with these evaluations:
                suspicious_score: ${similar_activity['aiEvaluationScore']}
                explanation: ${similar_activity['aiEvaluation']}"""},
                {
                "type": "image_url",
                "image_url": {
                    "url": similar_activity['imageUrl'],
                },
                }
            ]
        })
    response = client.chat.completions.create(
        model="gpt4o",
        messages= similar_activites_messages + [
            {
                "role": "system",
                "content": [
                    {"type": "text", "text": f"Use the above images and their evaluations as reference when evaluating the following image."},
                ]
            },
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
                }
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
        q_consumer_process = multiprocessing.Process(target=q_consumer, args=(uploadFrame_q,))
        q_consumer_process.start()

    # model = YOLO('merged.pt')
    model = YOLO('yolov8n.pt')
    model.model.names.update({ 24: 'isolated bag', 28: 'isolated bag' })    # hacky way to change 'backpack' and 'suitcase' to 'isolated bag'
    print(model.model.names)
    # target_classes = ['backpack', 'handbag', 'suitcase', 'baseball bat', 'fork', 'knife', 'scissors', 'cell phone']
    # target_classes = additional_classes
    target_classes = ['isolated bag']
    # target_classes = ['backpack', 'handbag', 'suitcase', 'isolated bag']

    cap = cv2.VideoCapture(0)
    # note: change line 174 of yolo-live/.venv-3.9/lib/python3.9/site-packages/deep_sort_realtime/embedder/embedder_pytorch.py to:
        # self.gpu = gpu and torch.backends.mps.is_available()
        # if self.gpu:
        #     device = 'mps'
    # tracker = DeepSort(embedder='torchreid', embedder_model_name='osnet_x1_0', embedder_wts='./log/resnet50/model/model.pth.tar-10', max_age=6000)
    # tracker = DeepSort(embedder='torchreid', max_age=6000, embedder_wts='./log/custom_video_dataset/model/model.pth.tar-5')
    tracker = DeepSort(embedder='torchreid', max_age=6000, n_init=2)
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
        results = model(frame, verbose=False)

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

        tracks = tracker.update_tracks(detections, frame=frame)
        
        # try:
        #     embeds = tracker.generate_embeds(frame, detections)
        #     _, unmatched_track_idxs, _ = tracker.tracker._match(tracker.create_detections(detections, embeds))
        # except RuntimeError:
        #     unmatched_track_idxs = [i for i in range(len(tracks))]
        
        # get current tracks that are undetected (code from DeepSort's update_tracks)
        if len(detections) > 0:
            assert len(detections[0][0])==4
            raw_detections = [d for d in detections if d[0][2] > 0 and d[0][3] > 0]
            embeds = tracker.generate_embeds(frame, raw_detections)
            generated_detections = tracker.create_detections(raw_detections, embeds)
            _, unmatched_track_idxs, _ = tracker.tracker._match(generated_detections)
        else:
            # if no detections, then all tracks must be unmatched 
            unmatched_track_idxs = [i for i in range(len(tracks))]

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
        print('YOLO detections:', detections)
        print('Currently detected tracks:', [track.track_id for track in detected_tracks])
        print('Just exited tracks (within past 5 frames):', [track.track_id for track in just_exited_tracks])
        print('Tracks that are remembered:', [track.track_id for track in new_tracks])
        print('\n')

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
            # if class was detected within the last 1800 frames, ignore
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

        # for demo, show original frame, with bounding boxes if target_classes are detected
        # for track in detected_tracks:
        # displayed_tracks_boxes = []
        for track in detected_tracks + just_exited_tracks:
            if track.det_class not in target_classes:
                continue
            track_id = track.track_id
            ltrb = track.to_ltrb()
            x1, y1, x2, y2 = ltrb
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            w, h = x2 - x1, y2 - y1

            # is_duplicate = False
            # for box in displayed_tracks_boxes:
            #     if calculate_iou(box, [x1, y1, w, h]) > 0.1:
            #         is_duplicate = True
            #         break
            # if is_duplicate:
            #     continue

            # displayed_tracks_boxes.append([x1, y1, w, h])
            # cv2.putText(frame, f'ID: {track_id}, Conf: {track.det_conf}, Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.putText(frame, f'ID: {track_id}, Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            # cv2.putText(frame, f'Class: {track.det_class}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
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