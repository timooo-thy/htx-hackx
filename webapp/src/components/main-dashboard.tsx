"use client";

import { Suspense } from "react";
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

export function MainDashboard() {
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">423</div>
                <p className="text-xs text-muted-foreground">
                  -3.2% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Officers on Duty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last shift
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Emergency Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">29</div>
                <p className="text-xs text-muted-foreground">+7 in last hour</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>You have 3 new alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
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
