import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

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

export const getActivityById = internalQuery({
  args: {
    id: v.id("activity"),
  },
  handler: async (ctx, { id }) => {
    const activity = await ctx.db.get(id);
    return activity;
  },
});

export const getActivitiesByIds = internalQuery({
  args: {
    ids: v.array(v.id("activity")),
  },
  handler: async (ctx, { ids }) => {
    const results = [];

    for (const activityId of ids) {
      const activity = await ctx.db.get(activityId);
      if (activity === null) {
        continue;
      }
      results.push(activity);
    }

    return results;
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
      embeddings: [],
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

export const updateActivityEmbeddings = internalMutation({
  args: {
    id: v.id("activity"),
    embeddings: v.array(v.float64()),
    imageDescription: v.string(),
  },
  handler: async (ctx, { id, embeddings, imageDescription }) => {
    await ctx.db.patch(id, {
      embeddings,
      imageDescription,
    });
  },
});

export const createEmbeddings = action({
  args: {
    id: v.id("activity"),
  },
  handler: async (ctx, { id }) => {
    const activity = await ctx.runQuery(internal.activity.getActivityById, {
      id,
    });

    if (
      !activity ||
      !activity.imageId ||
      !activity.aiEvaluation ||
      (activity.aiEvaluationScore && activity.aiEvaluationScore < 0.7)
    ) {
      return;
    }

    const imageUrl = await ctx.runQuery(api.activity.getImageStorageUrl, {
      imageId: activity.imageId as Id<"_storage">,
    });

    if (!imageUrl) {
      return;
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "This is an image of a " +
                activity.objectClass +
                " in " +
                activity.location +
                "Describe the image succinctly for use as a vector embedding for RAG.",
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
    });

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: text,
    });

    await ctx.runMutation(internal.activity.updateActivityEmbeddings, {
      id,
      embeddings: embedding,
      imageDescription: text,
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

    const filteredNotified = Object.fromEntries(
      Object.entries(notified).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredNotified);
  },
});

export const getSimilarActivities = action({
  args: {
    id: v.id("activity"),
  },
  handler: async (ctx, { id }) => {
    const activity = await ctx.runQuery(internal.activity.getActivityById, {
      id,
    });

    if (!activity || !activity.imageId) {
      return;
    }

    const imageUrl = await ctx.runQuery(api.activity.getImageStorageUrl, {
      imageId: activity.imageId as Id<"_storage">,
    });

    if (!imageUrl) {
      return;
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "This is an image of a " +
                activity.objectClass +
                " in " +
                activity.location +
                "Generate a short search query to conduct similarity search in a vector database.",
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
    });

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: text,
    });

    const results = await ctx.vectorSearch("activity", "by_embedding", {
      vector: embedding,
      limit: 3,
      filter: (q) => q.eq("objectClass", activity.objectClass),
    });

    const filteredResults: {
      _id: Id<"activity">;
      _score: number;
    }[] = results.filter((result) => result._score > 0.5);

    const activities: Array<Doc<"activity">> = await ctx.runQuery(
      internal.activity.getActivitiesByIds,
      {
        ids: filteredResults.map((result) => result._id),
      }
    );

    return activities;
  },
});
