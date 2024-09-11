import os

from dotenv import load_dotenv
from convex import ConvexClient

load_dotenv(".env.local")
load_dotenv()

client = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))
print(client.query("trainingJob:getAllTrainingJobs"))
