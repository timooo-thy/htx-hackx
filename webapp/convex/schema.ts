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
    title: v.string(),
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
    description: v.string(),
    location: v.string(),
    imageId: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("evaluated")),
    aiEvaluation: v.optional(v.string()),
    aiEvaluationScore: v.optional(v.number()),
  }),
  officers: defineTable({
    name: v.string(),
  }),
});
