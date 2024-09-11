import { query } from "./_generated/server";

export const getTabsOverviewData = query({
  args: {},
  handler: async (ctx, _) => {
    const data = await ctx.db.query("tabsOverviewData").collect();
    return data;
  },
});
