import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TabsType } from "@/lib/types";

type StatsCardProps = {
  title: string;
  value: number;
  description: string;
  tab: TabsType;
  onClick: (tabs: TabsType) => void;
};

export default function StatsCard({
  description,
  title,
  value,
  tab,
  onClick,
}: StatsCardProps) {
  return (
    <Card onClick={() => onClick(tab)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}h</p>
      </CardContent>
    </Card>
  );
}
