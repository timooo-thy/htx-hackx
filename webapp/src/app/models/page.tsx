"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelsCards } from "@/components/models-cards";

export default function ModelsPage() {
  const trainingJobs = useQuery(
    api.trainingJobs.getAllTrainingJobsWithWeights,
    {}
  );
  const [activeTab, setActiveTab] =
    useState<Doc<"trainingJobs">["environment"]>("dev");

  const activeTabModels = trainingJobs?.filter(
    (data) => data.environment === activeTab
  );

  const handleTabChange = (tab: Doc<"trainingJobs">["environment"]) =>
    setActiveTab(tab);

  return (
    <div className="min-h-[calc(100vh-144px)] w-5/6 m-auto">
      <h1 className="text-3xl font-bold tracking-tight py-6">
        YOLO v11 Models
      </h1>
      <Tabs defaultValue="dev" className="space-y-8 md:space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-18 md:h-9">
          <TabsTrigger value="dev" onClick={() => handleTabChange("dev")}>
            Development
          </TabsTrigger>
          <TabsTrigger value="uat" onClick={() => handleTabChange("uat")}>
            UAT
          </TabsTrigger>
          <TabsTrigger
            value="staging"
            onClick={() => handleTabChange("staging")}
          >
            Staging
          </TabsTrigger>
          <TabsTrigger value="prod" onClick={() => handleTabChange("prod")}>
            Production
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dev" className="space-y-4">
          <ModelsCards trainingJobs={activeTabModels} />
        </TabsContent>
        <TabsContent value="uat" className="space-y-4">
          <ModelsCards trainingJobs={activeTabModels} />
        </TabsContent>
        <TabsContent value="staging" className="space-y-4">
          <ModelsCards trainingJobs={activeTabModels} />
        </TabsContent>
        <TabsContent value="prod" className="space-y-4">
          <ModelsCards trainingJobs={activeTabModels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
