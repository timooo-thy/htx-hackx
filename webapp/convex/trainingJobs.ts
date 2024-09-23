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

export const getAllTrainingJobsWithWeights = query({
  args: {},
  handler: async (ctx, _) => {
    const trainingJobs = await ctx.db
      .query("trainingJobs")
      .filter((q) =>
        q.not(
          q.or(
            q.eq(q.field("status"), "segmenting"),
            q.eq(q.field("status"), "completed")
          )
        )
      )
      .order("desc")
      .collect();

    const trainingJobsWithWeights = await Promise.all(
      trainingJobs.map(async (trainingJob) => {
        const modelFile = await ctx.storage.getUrl(
          trainingJob.trainedModelFile as Id<"_storage">
        );
        return { ...trainingJob, modelFile };
      })
    );
    return trainingJobsWithWeights;
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
      v.literal("trained"),
      v.literal("deployed")
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
    _id: v.id("trainingJobs"),
    status: v.optional(
      v.union(
        v.literal("segmenting"),
        v.literal("training"),
        v.literal("completed"),
        v.literal("trained"),
        v.literal("deployed")
      )
    ),
    trainingProgress: v.optional(v.number()),
    segmentingProgress: v.optional(v.number()),
    maskedImageIds: v.optional(v.array(v.string())),
    trainedModelFile: v.optional(v.string()),
    videoIds: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    {
      _id,
      status,
      segmentingProgress,
      trainingProgress,
      maskedImageIds,
      trainedModelFile,
      videoIds,
    }
  ) => {
    const updateFields = {
      status,
      segmentingProgress,
      trainingProgress,
      maskedImageIds,
      trainedModelFile,
      videoIds,
    };

    // Remove undefined fields
    const filteredUpdateFields = Object.fromEntries(
      Object.entries(updateFields).filter(([_, v]) => v !== undefined)
    );

    const trainingJob = await ctx.db.patch(_id, filteredUpdateFields);
    return trainingJob;
  },
});
