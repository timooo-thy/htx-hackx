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

export const getImageStorageUrl = query({
  args: { imageId: v.id("_storage") },
  handler: async (ctx, { imageId }) => {
    return await ctx.storage.getUrl(imageId);
  },
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
      aiNotified: false,
      initialNotified: false,
    });
    return activity;
  },
});

export const updateActivity = mutation({
  args: {
    id: v.id("activity"),
    aiEvaluation: v.string(),
    aiEvaluationScore: v.number(),
  },
  handler: async (ctx, { id, aiEvaluation, aiEvaluationScore }) => {
    await ctx.db.patch(id, {
      aiEvaluation,
      aiEvaluationScore,
      status: "evaluated",
    });
  },
});

export const updateActivityNotification = mutation({
  args: {
    id: v.id("activity"),
    aiNotified: v.optional(v.boolean()),
    initialNotified: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, aiNotified, initialNotified }) => {
    const notified = {
      aiNotified,
      initialNotified,
    };

    const filtedNotified = Object.fromEntries(
      Object.entries(notified).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filtedNotified);
  },
});
