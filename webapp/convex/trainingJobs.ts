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
    status: v.union(
      v.literal("segmenting"),
      v.literal("training"),
      v.literal("completed"),
      v.literal("trained")
    ),
    videoIds: v.array(v.string()),
    jobName: v.string(),
  },
  handler: async (ctx, { status, videoIds, jobName }) => {
    const trainingJob = await ctx.db.insert("trainingJobs", {
      status,
      trainingProgress: 0,
      segmentingProgress: 0,
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
    status: v.optional(
      v.union(
        v.literal("segmenting"),
        v.literal("training"),
        v.literal("completed"),
        v.literal("trained")
      )
    ),
    trainingProgress: v.optional(v.number()),
    segmentingProgress: v.optional(v.number()),
    maskedImageIds: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    { id, status, segmentingProgress, trainingProgress, maskedImageIds }
  ) => {
    const trainingJob = await ctx.db.patch(id, {
      status,
      segmentingProgress,
      trainingProgress,
      maskedImageIds,
    });
    return trainingJob;
  },
});
