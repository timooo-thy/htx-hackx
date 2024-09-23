"use server";

import { fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";

export async function startSegmenting(form: FormData) {
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

    const jobId = await fetchMutation(api.trainingJobs.postTrainingJob, {
      status: "segmenting",
      videoIds: [storageId],
      jobName: description + " detection model",
    });

    const updateProgress = async () => {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await fetchMutation(api.trainingJobs.updateTrainingJob, {
          _id: jobId,
          segmentingProgress: i === 100 ? 99 : i,
        });
      }

      const directoryPath = "./public/segmented_images";

      const files = fs.readdirSync(directoryPath);

      const readFiles = files.map(async (file) => {
        const filePath = path.join(directoryPath, file);
        const fileBuffer = fs.readFileSync(filePath);
        const fileType = await fileTypeFromBuffer(fileBuffer);
        return {
          name: file,
          buffer: fileBuffer,
          type: fileType ? fileType.mime : "application/octet-stream",
        };
      });

      const imageFiles = await Promise.all(readFiles);
      const imageIds: string[] = [];

      await Promise.all(
        imageFiles.map(async (file) => {
          const uploadUrl = await fetchMutation(
            api.trainingJobs.generateUploadUrl
          );

          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "Content-Type": file.type,
            },
            body: file.buffer,
          });

          if (!response.ok) {
            throw new Error(
              `Failed to upload ${file.name}: ${response.statusText}`
            );
          }

          const { storageId } = await response.json();
          imageIds.push(storageId);
        })
      );

      await fetchMutation(api.trainingJobs.updateTrainingJob, {
        maskedImageIds: imageIds,
        _id: jobId,
        segmentingProgress: 100,
        status: "segmented",
      });
    };

    updateProgress();
    return { success: true };
  } catch (error) {
    return { error: "Failed to upload video" };
  }
}
