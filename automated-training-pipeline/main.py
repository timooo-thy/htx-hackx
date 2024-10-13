from pathlib import Path
from dotenv import load_dotenv
from convex import ConvexClient
from autodistill.detection import CaptionOntology
from autodistill_grounded_sam_2 import GroundedSAM2
from fastapi import BackgroundTasks, FastAPI, Form, UploadFile
import os
import requests
import cv2
import supervision as sv
import uuid

app = FastAPI()


load_dotenv("../webapp/.env.local")
load_dotenv()

# Constants
VIDEO_DIR_PATH = "videos"
IMAGE_DIR_PATH = "images"
DATASET_DIR_PATH = "dataset"
FRAME_STRIDE = 10
CONVEX_URL = "https://capable-bee-948.convex.cloud"
CONVEX_CLIENT = ConvexClient(CONVEX_URL)


@app.post("/generate-images")
async def sample_images_from_video(
    background_tasks: BackgroundTasks,
    training_id: str = Form(...),
    description: str = Form(...),
):
    # Define a background task for image extraction
    if not os.path.exists(f"./{VIDEO_DIR_PATH}/{training_id}"):
        os.makedirs(f"./{VIDEO_DIR_PATH}/{training_id}")
    
    target_dir_path = Path(f"./{VIDEO_DIR_PATH}/{training_id}")

    background_tasks.add_task(process_video, training_id, description, target_dir_path)

    return {"message": "Processing video in the background"}


def process_video(training_id: str, description: str, target_dir_path: Path):
    # Create directory for the uploaded file's images
    # Initialize OpenCV video capture

    training_job = CONVEX_CLIENT.query("trainingJobs:getTrainingJobById", dict(jobId=training_id))
    video_id = training_job.get("videoIds", [])[0]
    video_url = CONVEX_CLIENT.query("trainingJobs:getTrainingVideoUrl", dict(videoId=video_id))
    video = requests.get(video_url)
    video_path = f"{target_dir_path}/{training_id}.mp4"
    with open(video_path, "wb") as f:
        f.write(video.content)

    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    # Set ontology for the model
    ontology = CaptionOntology(
        {
            description: "suspecious item",
        }
    )

    base_model = GroundedSAM2(
        ontology=ontology, model="Grounding DINO", grounding_dino_box_threshold=0.5
    )

    mask_annotator = sv.MaskAnnotator()
    box_annotator = sv.BoxAnnotator()

    if not os.path.exists(f"./{IMAGE_DIR_PATH}/{training_id}"):
        os.makedirs(f"./{IMAGE_DIR_PATH}/{training_id}")

    if not os.path.exists(f"./{IMAGE_DIR_PATH}/{training_id}/annotated"):
        os.makedirs(f"./{IMAGE_DIR_PATH}/{training_id}/annotated")
    
    masked_image_ids = []
    image_count = int(frame_count / fps)

    for i in range(image_count):
        arr_frame = []
        arr_lap = []
        for _ in range(fps):  # Loop through one second of frames
            success, frame = cap.read()
            if not success:
                break
            laplacian = cv2.Laplacian(frame, cv2.CV_64F).var()  # Sharpness metric
            arr_lap.append(laplacian)
            arr_frame.append(frame)

        # Save the sharpest frame
        if arr_frame:
            unique_id = f"{uuid.uuid4()}"
            unique_name = f"{unique_id}.jpg"
            selected_frame = arr_frame[arr_lap.index(max(arr_lap))]
            frame_save_path = f"./{IMAGE_DIR_PATH}/{training_id}/{unique_name}"
            annotated_frame_save_path = (
                f"./{IMAGE_DIR_PATH}/{training_id}/annotated/{unique_name}"
            )
            print("Processing frame: ", frame_save_path)
            result = base_model.predict(selected_frame)
            annotated_image = mask_annotator.annotate(
                selected_frame.copy(), detections=result
            )
            annotated_image = box_annotator.annotate(
                annotated_image, detections=result, labels=["suspecious item"]
            )
            print("saving frame: ", frame_save_path)
            cv2.imwrite(frame_save_path, selected_frame)
            cv2.imwrite(annotated_frame_save_path, annotated_image)
            status = i * 100 // image_count
            masked_image_ids = upload_image_to_convex(training_id, annotated_frame_save_path, status, masked_image_ids)

    CONVEX_CLIENT.mutation(
        "trainingJobs:updateTrainingJob",
        dict(
            _id=training_id,
            status="segmented",
            segmentingProgress=100,
        ),
    )
    print("Done")
    cap.release()


# Upload the image to Convex
def upload_image_to_convex(training_id, image_path: str, status:int, masked_image_ids: list = []):
    tempUrl = CONVEX_CLIENT.mutation("trainingJobs:generateUploadUrl")
    result = requests.post(
        tempUrl,
        headers={"Content-Type": "image/jpeg"},
        data=open(image_path, "rb").read(),
    )
    masked_image_ids.append(result.json()["storageId"])
    CONVEX_CLIENT.mutation(
        "trainingJobs:updateTrainingJob",
        dict(
            _id=training_id,
            status="segmenting",
            segmentingProgress=status,
            maskedImageIds=masked_image_ids,
        ),
    )
    
    return masked_image_ids
