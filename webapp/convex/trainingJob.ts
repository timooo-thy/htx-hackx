import { query } from "./_generated/server";

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
