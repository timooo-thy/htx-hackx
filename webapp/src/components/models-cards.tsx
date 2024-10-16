import { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Doc, Id } from "../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, FileText } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

type ModelsPageProps = {
  trainingJobs:
    | FunctionReturnType<typeof api.trainingJobs.getAllTrainingJobsWithWeights>
    | undefined;
};

export const ModelsCards = ({ trainingJobs }: ModelsPageProps) => {
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

  const nextEnv = () => {
    if (!trainingJobs) {
      return "dev";
    }

    if (trainingJobs[0].environment === "dev") {
      return "UAT";
    } else if (trainingJobs[0].environment === "uat") {
      return "Staging";
    } else if (trainingJobs[0].environment === "staging") {
      return "Production";
    } else {
      return "dev";
    }
  };

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

  const handlePush = async (
    jobId: Id<"trainingJobs">,
    environment: Doc<"trainingJobs">["environment"]
  ) => {
    let nextEnvironment = "dev";

    if (environment === "dev") {
      nextEnvironment = "uat";
    } else if (environment === "uat") {
      nextEnvironment = "staging";
    } else if (environment === "staging") {
      nextEnvironment = "prod";
    }

    await mutateDeployModel({
      _id: jobId,
      environment: nextEnvironment as Doc<"trainingJobs">["environment"],
    });

    toast.success(`Pushed model to ${nextEnv()}`);
  };

  return (
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
                  {job.trainedModelFile
                    ? job.trainedModelFile + ".pt"
                    : "Training in Progress..."}
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
          <CardFooter className="grid grid-cols-2 space-x-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={
                    job.status === "deployed" ||
                    deployedModel === job.jobName ||
                    job.status === "training"
                  }
                  className={`${job.status === "deployed" && "bg-green-600 text-white"} w-full col-span-1`}
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
                      onClick={() => handleDeploy(deployedModel ?? "", job._id)}
                    >
                      Deploy
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {job.environment !== "prod" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    disabled={job.status === "deployed"}
                    className="col-span-1"
                  >{`Push to ${nextEnv()}`}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{`Confirm push to ${nextEnv()}?`}</DialogTitle>
                    <DialogDescription>
                      <p>
                        Are you sure you want to push this model to {nextEnv()}?
                      </p>
                      <p>This will push the model to the next environment.</p>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        onClick={() => handlePush(job._id, job.environment)}
                      >
                        Push
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
