import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Doc } from "../../convex/_generated/dataModel";

type OverviewProps = {
  data: Doc<"tabsOverviewData">;
};
export function Overview({
  data: { keyName, label, chartTitle, chartData, color },
}: OverviewProps) {
  const chartConfig = {
    [keyName]: {
      label: label,
      color: `hsl(var(--chart-${color}))`,
    },
  } satisfies ChartConfig;

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey={keyName}
              fill={`var(--color-${keyName}) `}
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-400">
          Last updated: {chartData[chartData.length - 1].month}
        </p>
      </CardFooter>
    </Card>
  );
}
