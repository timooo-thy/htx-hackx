import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getAllTrainingJobs = query({
  args: {},
  handler: async (ctx, _) => {
    const trainingJobs = await ctx.db
      .query("trainingJobs")
      .order("desc")
      .collect();
    return trainingJobs;
  },
});

export const getAllTrainingJobsWithUrls = query({
  args: {},
  handler: async (ctx, _) => {
    const trainingJobs = await ctx.db
      .query("trainingJobs")
      .order("desc")
      .collect();

    const trainingJobsWithUrls = await Promise.all(
      trainingJobs.map(async (trainingJob) => {
        const imageUrls = await Promise.all(
          trainingJob.maskedImageIds.map(async (imageId) => {
            return await ctx.storage.getUrl(imageId as Id<"_storage">);
          })
        );
        return { ...trainingJob, imageUrls };
      })
    );
    return trainingJobsWithUrls;
  },
});

export const getTrainingJobById = query({
  args: { jobId: v.id("trainingJobs") },
  handler: async (ctx, { jobId }) => {
    const trainingJob = await ctx.db.get(jobId);
    return trainingJob;
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const postTrainingJob = mutation({
  args: {
    status: v.union(v.literal("training"), v.literal("completed")),
    progress: v.number(),
    videoIds: v.array(v.string()),
    jobName: v.string(),
  },
  handler: async (ctx, { status, progress, videoIds, jobName }) => {
    const trainingJob = await ctx.db.insert("trainingJobs", {
      status,
      progress,
      videoIds,
      jobName,
      maskedImageIds: [],
    });
    return trainingJob;
  },
});

export const updateTrainingJob = mutation({
  args: {
    id: v.id("trainingJobs"),
    status: v.union(v.literal("training"), v.literal("completed")),
    progress: v.number(),
    maskedImageIds: v.array(v.string()),
  },
  handler: async (ctx, { id, status, progress, maskedImageIds }) => {
    const trainingJob = await ctx.db.patch(id, {
      status,
      progress,
      maskedImageIds,
    });
    return trainingJob;
  },
});
