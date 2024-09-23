import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const getAllActivities = query({
  args: {},
  handler: async (ctx, _) => {
    const activities = await ctx.db.query("activity").order("desc").collect();
    const activitiesWithOfficerNames = await Promise.all(
      activities.map(async (activity) => {
        const officerName = await ctx.db.get(activity.officerId);
        return { ...activity, officerName: officerName?.name ?? "" };
      })
    );

    return activitiesWithOfficerNames;
  },
});

export const getSuspiciousActivities = query({
  args: {},
  handler: async (ctx, _) => {
    const activities = await ctx.db
      .query("activity")
      .filter((q) => q.eq(q.field("title"), "Patrol Update"))
      .order("desc")
      .collect();

    const activitiesWithImageUrls = await Promise.all(
      activities.map(async (activity) => {
        const imageUrl = await ctx.storage.getUrl(
          activity.imageId as Id<"_storage">
        );
        return { ...activity, imageUrl };
      })
    );

    return activitiesWithImageUrls;
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const postActivity = mutation({
  args: {
    title: v.string(),
    officerId: v.id("officers"),
    description: v.string(),
    objectClass: v.optional(v.string()),
    location: v.string(),
    imageId: v.optional(v.id("_storage")),
    status: v.union(v.literal("pending"), v.literal("evaluated")),
    aiEvaluation: v.optional(v.string()),
    aiEvaluationScore: v.optional(v.number()),
  },
  handler: async (
    ctx,
    {
      title,
      officerId,
      description,
      objectClass,
      location,
      imageId,
      status,
      aiEvaluation,
      aiEvaluationScore,
    }
  ) => {
    const activity = await ctx.db.insert("activity", {
      title,
      officerId,
      description,
      objectClass,
      location,
      imageId,
      status,
      aiEvaluation,
      aiEvaluationScore,
    });
    return activity;
  },
});
