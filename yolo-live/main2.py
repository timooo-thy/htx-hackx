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
        cv2.imshow('frame', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
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
                {"type": "text", "text": f"Judge whether the object in the image, identified as a ${class_name}, is suspicious. Take into account the object's appearance and the place where the object is located."},
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
                            'min': 0,
                            'max': 1,
                            'explanation': '1 is the most suspicious, 0 is not suspicious'
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

    model = YOLO('yolov8n.pt', verbose=False)
    # model = YOLO('best.pt')
    print(model.model.names)
    target_classes = ['backpack', 'handbag', 'suitcase', 'baseball bat', 'fork', 'knife', 'scissors', 'cell phone']
    cap = cv2.VideoCapture(0)
    tracker = DeepSort(embedder='torchreid', max_age=6000)
    confirmed_track_ids = set()     # track_ids that have been confirmed before (but could be marked as deleted if not detected for a long time)

    while True:
        ret, frame = cap.read()
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

        print([(track.track_id, track.is_confirmed()) for track in tracks])
        print(unmatched_track_idxs)
        print([track.track_id for track in detected_tracks])
        print([track.track_id for track in just_exited_tracks])
        print([track.track_id for track in new_tracks])
        
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
        
        for track in detected_newly_confirmed_tracks:
            if track.det_class not in target_classes:
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