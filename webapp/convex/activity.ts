import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export const getAllActivities = query({
  args: {},
  handler: async (ctx, _) => {
    const activities = await ctx.db.query("activity").order("desc").collect();
    return activities;
  },
});

export const getSuspiciousActivities = query({
  args: {},
  handler: async (ctx, _) => {
    const activities = await ctx.db
      .query("activity")
      .filter((q) => q.not(q.eq(q.field("imageId"), undefined)))
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
