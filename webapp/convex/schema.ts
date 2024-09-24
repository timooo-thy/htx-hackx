import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tabsOverviewData: defineTable({
    keyName: v.union(
      v.literal("incidents"),
      v.literal("cases"),
      v.literal("officers"),
      v.literal("calls")
    ),
    label: v.string(),
    chartTitle: v.string(),
    cardTitle: v.string(),
    totalNumber: v.number(),
    cardDescription: v.string(),
    chartData: v.array(
      v.object({
        month: v.string(),
        incidents: v.optional(v.number()),
        cases: v.optional(v.number()),
        officers: v.optional(v.number()),
        calls: v.optional(v.number()),
      })
    ),
    color: v.string(),
  }),
  activity: defineTable({
    title: v.string(),
    officerId: v.id("officers"),
    objectClass: v.optional(v.string()),
    description: v.string(),
    location: v.string(),
    imageId: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("evaluated")),
    aiEvaluation: v.optional(v.string()),
    aiEvaluationScore: v.optional(v.number()),
    aiNotified: v.boolean(),
    initialNotified: v.boolean(),
  }),
  officers: defineTable({
    name: v.string(),
  }),
  trainingJobs: defineTable({
    jobName: v.string(),
    status: v.union(
      v.literal("segmenting"),
      v.literal("training"),
      v.literal("segmented"),
      v.literal("trained"),
      v.literal("deployed")
    ),
    trainingProgress: v.number(),
    segmentingProgress: v.number(),
    videoIds: v.array(v.string()),
    maskedImageIds: v.array(v.string()),
    trainedModelFile: v.optional(v.string()),
    notified: v.boolean(),
  }),
});
