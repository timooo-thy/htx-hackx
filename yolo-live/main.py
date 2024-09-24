import os

from dotenv import load_dotenv
from convex import ConvexClient
import requests

load_dotenv(".env.local")
load_dotenv()

CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL")

client = ConvexClient(CONVEX_URL)

# Create a temp url to upload image
tempUrl = client.mutation("trainingJobs:generateUploadUrl")

# Upload image to temp url (convex storage)
result = requests.post(
    tempUrl,
    headers={"Content-Type": "image/jpeg"},
    data=open("test.jpg", "rb").read(),
)

# Patch training job with image url
client.mutation("trainingJobs:updateTrainingJob", dict(
    id="jn7d1hj6512my8rrswrcjrqqr170qw10",
    status="training",
    progress=50,
    maskedImageIds=[result.json()["storageId"]],
)
)
