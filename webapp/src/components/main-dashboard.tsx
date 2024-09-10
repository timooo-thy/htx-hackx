"use client";

import { Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Overview } from "./overview";
import { RecentActivity } from "./recent-activity";
import { PatrolMap } from "./patrol-map";
import { YoloDashboard } from "./yolo-dashboard";
import { SuspiciousObjectsTable } from "./suspicious-objects-table";
import StatsCard from "./stats-card";
import { statsCardData, tabsOverviewData } from "@/lib/data";
import { TabsType } from "@/lib/types";

export function MainDashboard() {
  const [activeTab, setActiveTab] = useState<TabsType>("calls");
  const handleTabChange = (tab: TabsType) => setActiveTab(tab);

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suspicious-objects">
            Suspicious Objects
          </TabsTrigger>
          <TabsTrigger value="patrol-map">Patrol Map</TabsTrigger>
          <TabsTrigger value="yolo-training">YOLO Training</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCardData.map((card, i) => (
              <StatsCard {...card} key={i} onClick={handleTabChange} />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 ">
            <div className="col-span-4">
              <Overview {...tabsOverviewData[activeTab]} />
            </div>
            <div className="col-span-3">
              <RecentActivity />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="suspicious-objects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Objects</CardTitle>
              <CardDescription>
                Review and evaluate potential threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading...</div>}>
                <SuspiciousObjectsTable />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="patrol-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patrol Map</CardTitle>
              <CardDescription>
                Current officer locations and active incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatrolMap />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="yolo-training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>YOLO Training</CardTitle>
              <CardDescription>
                Upload suspicious videos and train YOLOv8 models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <YoloDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
