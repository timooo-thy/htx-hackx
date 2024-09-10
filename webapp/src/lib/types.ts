export type TabsType = "incidents" | "cases" | "officers" | "calls";
export type ChartDataType = {
  month: string;
  cases?: number;
  incidents?: number;
  officers?: number;
  calls?: number;
};
