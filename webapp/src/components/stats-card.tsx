import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Doc } from "../../convex/_generated/dataModel";

type StatsCardProps = {
  data: Doc<"tabsOverviewData">;
  onClick: (tabs: Doc<"tabsOverviewData">["keyName"]) => void;
};

export default function StatsCard({
  data: { keyName, cardTitle, totalNumber, cardDescription },
  onClick,
}: StatsCardProps) {
  return (
    <Card
      onClick={() => onClick(keyName)}
      className="cursor-pointer hover:shadow-lg transition-shadow"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalNumber.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{cardDescription}</p>
      </CardContent>
    </Card>
  );
}
