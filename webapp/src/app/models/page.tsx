"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogClose } from "@radix-ui/react-dialog";

export default function ModelsPage() {
  const trainingJobs = useQuery(
    api.trainingJobs.getAllTrainingJobsWithWeights,
    {}
  );
  const mutateDeployModel = useMutation(api.trainingJobs.updateTrainingJob);
  const [deployedModel, setDeployedModel] = useState<string | undefined>();

  useEffect(() => {
    if (trainingJobs) {
      const deployedJob = trainingJobs.find((job) => job.status === "deployed");
      if (deployedJob) {
        setDeployedModel(deployedJob._id);
      }
    }
  }, [trainingJobs]);

  const handleDeploy = async (
    deployedModel: Id<"trainingJobs"> | string,
    newJobId: Id<"trainingJobs">
  ) => {
    const prevModel = trainingJobs?.find((job) => job._id === deployedModel);
    const newModel = trainingJobs?.find((job) => job._id === newJobId);

    // Un-deploy the currently deployed model
    if (deployedModel === "" || !prevModel || !newModel) {
      toast.error("Error deploying model");
      return;
    }

    const { jobName, modelFile, _creationTime, notified, ...rest } = prevModel;
    const {
      jobName: newJobName,
      modelFile: newModelFile,
      _creationTime: _newCreationTime,
      notified: _newNotified,
      ...newRest
    } = newModel;

    await mutateDeployModel({
      ...rest,
      _id: deployedModel as Id<"trainingJobs">,
      status: "trained",
    });

    // Deploy the selected model
    await mutateDeployModel({
      ...newRest,
      _id: newJobId,
      status: "deployed",
    });

    setDeployedModel(newJobId);
    toast.success(`Deployed model: ${newModel.jobName}`);
  };

  return (
    <div className="min-h-[calc(100vh-144px)] w-5/6 m-auto">
      <h1 className="text-3xl font-bold tracking-tight py-6">YOLO v8 Models</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {trainingJobs?.map((job) => (
          <Card key={job.jobName} className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{job.jobName}</span>
                <Badge
                  variant={job.status === "trained" ? "default" : "secondary"}
                  className={`${job.status === "deployed" && "bg-green-600 text-white"}`}
                >
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    Weights:{" "}
                    {job.trainedModelFile + ".pt" || "Training in Progress..."}
                  </span>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    Training Progress: {job.trainingProgress}%
                  </span>
                </div>
                {deployedModel === job.jobName && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span className="text-sm">Currently Deployed</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    disabled={
                      job.status === "deployed" ||
                      deployedModel === job.jobName ||
                      job.status === "training"
                    }
                    className={`${job.status === "deployed" && "bg-green-600 text-white"} w-full`}
                  >
                    {deployedModel === job._id ? "Deployed" : "Deploy Model"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Deploy Model</DialogTitle>
                    <DialogDescription>
                      <p>Are you sure you want to deploy the model?</p>
                      <p>
                        This will replace the currently deployed model and push
                        the updates to the live system.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        onClick={() =>
                          handleDeploy(deployedModel ?? "", job._id)
                        }
                      >
                        Deploy
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
