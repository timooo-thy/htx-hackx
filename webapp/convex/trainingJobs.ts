import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
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
        q.or(
          q.eq(q.field("status"), "trained"),
          q.eq(q.field("status"), "deployed"),
          q.eq(q.field("status"), "training")
        )
      )
      .order("desc")
      .collect();

    const trainingJobsWithWeights = await Promise.all(
      trainingJobs.map(async (trainingJob) => {
        if (!trainingJob.trainedModelFile) {
          return { ...trainingJob, modelFile: "" };
        }
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
      v.literal("segmented"),
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
      notified: false,
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
        v.literal("segmented"),
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

    const filteredUpdateFields = Object.fromEntries(
      Object.entries(updateFields).filter(([_, v]) => v !== undefined)
    );

    const trainingJob = await ctx.db.patch(_id, filteredUpdateFields);
    return trainingJob;
  },
});

export const updateTrainingJobNotification = mutation({
  args: {
    id: v.id("trainingJobs"),
    notified: v.boolean(),
  },
  handler: async (ctx, { id, notified }) => {
    await ctx.db.patch(id, {
      notified,
    });
  },
});

export const updateTrainingJobProgress = internalMutation({
  args: {},
  handler: async (ctx, {}) => {
    const job = await ctx.db
      .query("trainingJobs")
      .filter((q) =>
        q.eq(
          q.field("_id"),
          "jn7exkvm7vyk50eerc25fcqe6h70j692" as Id<"trainingJobs">
        )
      )
      .unique();

    if (!job) {
      return;
    }

    await ctx.db.patch(
      "jn7exkvm7vyk50eerc25fcqe6h70j692" as Id<"trainingJobs">,
      {
        trainingProgress:
          job.trainingProgress === 100 ? 0 : job.trainingProgress + 1,
        status: job.trainingProgress + 1 === 100 ? "trained" : "training",
      }
    );
  },
});
