from pathlib import Path
from dotenv import load_dotenv
from convex import ConvexClient
from autodistill.detection import CaptionOntology
from autodistill_grounded_sam_2 import GroundedSAM2
from fastapi import BackgroundTasks, FastAPI, File, Form, UploadFile
import os
import requests
import cv2
import supervision as sv
import uuid

app = FastAPI()


load_dotenv(".env.local")
load_dotenv()

# Constants
VIDEO_DIR_PATH = "videos"
IMAGE_DIR_PATH = "images"
DATASET_DIR_PATH = "dataset"
FRAME_STRIDE = 10
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL")
CONVEX_CLIENT = ConvexClient(CONVEX_URL)


@app.post("/generate-images")
async def sample_images_from_video(
    background_tasks: BackgroundTasks,
    training_id: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
):
    # Define a background task for image extraction
    if not os.path.exists(f"./{VIDEO_DIR_PATH}/{training_id}"):
        os.makedirs(f"./{VIDEO_DIR_PATH}/{training_id}")

    file_data = await file.read()
    target_dir_path = Path(f"./{VIDEO_DIR_PATH}/{training_id}")

    # Save the uploaded file temporarily
    video_path = f"{target_dir_path}/{file.filename}"
    with open(video_path, "wb") as f:
        f.write(file_data)

    background_tasks.add_task(process_video, video_path, training_id, description)

    return {"message": "Processing video in the background"}


def process_video(video_path: str, training_id: str, description: str):
    # Create directory for the uploaded file's images
    # Initialize OpenCV video capture
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

    if not os.path.exists(f"./{IMAGE_DIR_PATH}/{training_id}"):
        os.makedirs(f"./{IMAGE_DIR_PATH}/{training_id}")

    if not os.path.exists(f"./{IMAGE_DIR_PATH}/{training_id}/annotated"):
        os.makedirs(f"./{IMAGE_DIR_PATH}/{training_id}/annotated")

    for i in range(int(frame_count / fps)):
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
            unique_name = f"{uuid.uuid4()}.jpg"
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
            print("saving frame: ", frame_save_path)
            cv2.imwrite(frame_save_path, selected_frame)
            cv2.imwrite(annotated_frame_save_path, annotated_image)
            upload_image_to_convex(annotated_frame_save_path)

    print("Done")
    cap.release()


# Upload the image to Convex
def upload_image_to_convex(image_path: str):
    tempUrl = CONVEX_CLIENT.mutation("trainingJobs:generateUploadUrl")
    result = requests.post(
        tempUrl,
        headers={"Content-Type": "image/jpeg"},
        data=open(image_path, "rb").read(),
    )
    CONVEX_CLIENT.mutation(
        "trainingJobs:updateTrainingJob",
        dict(
            id="jn7d1hj6512my8rrswrcjrqqr170qw10",
            status="training",
            progress=50,
            maskedImageIds=[result.json()["storageId"]],
        ),
    )
