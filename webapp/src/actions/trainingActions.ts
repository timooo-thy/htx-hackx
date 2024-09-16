"use server";

import { fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

export async function startTraining(form: FormData) {
  const videoFile = form.get("video") as File;
  const description = form.get("description") as string;

  if (!videoFile || !description) {
    return { error: "Please provide a video and description" };
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

    await fetchMutation(api.trainingJobs.postTrainingJob, {
      status: "segmenting",
      videoIds: [storageId],
      jobName: description + " detection model",
    });

    return { success: true };
  } catch (error) {
    return { error: "Failed to upload video" };
  }
}
