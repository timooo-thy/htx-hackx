"use server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
// import { sleep } from "@/lib/utils";
// import { waitUntil } from "@vercel/functions";

export async function startSegmenting(form: FormData) {
  const videoFile = form.get("video") as File;
  const description = form.get("description") as string;
  const testFile = form.get("test") as File;

  if (!videoFile || !description || !testFile) {
    return { error: "Please provide a video, test file and description" };
  }

  if (videoFile.size > 4500000) {
    return { error: "Please provide a video file smaller than 4.5MB" };
  }

  if (testFile.size > 4500000) {
    return { error: "Please provide a test file smaller than 4.5MB" };
  }

  try {
    const uploadUrl = await fetchMutation(api.trainingJobs.generateUploadUrl);
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": videoFile.type,
      },
      body: videoFile,
    });

    const { storageId } = await response.json();

    const jobId = await fetchMutation(api.trainingJobs.postTrainingJob, {
      status: "segmenting",
      videoIds: [storageId],
      jobName: description + " detection model",
    });

    const formData = new FormData();
    formData.append("training_id", jobId);
    formData.append("description", description);

    const trainingResponse = await fetch(`${SEGMENT_API_URL}/generate-images`, {
      method: "POST",
      body: formData,
    });

    if (!trainingResponse.ok) {
      return { error: "Failed to segment video" };
    }

    // const updateProgress = async () => {
    //   for (let i = 0; i <= 100; i += 10) {
    //     await new Promise((resolve) => setTimeout(resolve, 1000));
    //     await fetchMutation(api.trainingJobs.updateTrainingJob, {
    //       _id: jobId,
    //       segmentingProgress: i === 100 ? 99 : i,
    //     });
    //   }

    //   await sleep(1000);

    //   await fetchMutation(api.trainingJobs.updateTrainingJob, {
    //     maskedImageIds: [
    //       "kg20p6jq72s2c2kajp26rvwvnx71cgj6",
    //       "kg20mdz1eyy8dcnq1qqqawqnt971dwj8",
    //       "kg2cgk4ehwkwcdqmq1j5e8f1bn71c7nn",
    //     ],
    //     _id: jobId,
    //     segmentingProgress: 100,
    //     status: "segmented",
    //   });
    // };

    // waitUntil(updateProgress());
    return { success: true };
  } catch (error) {
    return { error: "Failed to upload video" };
  }
}
