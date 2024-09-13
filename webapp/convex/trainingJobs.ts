import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
