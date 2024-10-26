from datetime import datetime
from collections import defaultdict
import os
import cv2

def save_frame_locally(queue):
    detection_start_date_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    detected_objects_count_dict = defaultdict(lambda: 0)  # keys are (class_name, track_id), values are the count of those objects detected
    while True:
        dic = queue.get()
        frame, coord, track_id, class_name = dic['frame'], dic['coord'], dic['track_id'], dic['class']
        x1, y1, x2, y2 = coord
        os.makedirs(f'./detected_objects/{detection_start_date_time}/{class_name}/{track_id}', exist_ok=True)
        detected_objects_count_dict[(class_name, track_id)] += 1
        print('Writing to file:', f'./detected_objects/{detection_start_date_time}/{class_name}/{track_id}/{detected_objects_count_dict[(class_name, track_id)]}.jpg')
        cv2.imwrite(f'./detected_objects/{detection_start_date_time}/{class_name}/{track_id}/{detected_objects_count_dict[(class_name, track_id)]}.jpg', frame[y1:y2, x1:x2])
