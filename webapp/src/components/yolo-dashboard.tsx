"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DownloadIcon, SearchIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDebounce } from "@/lib/hooks";
import { startSegmenting } from "@/actions/trainingActions";
import { toast } from "sonner";
import TrainingFormButton from "./training-form-button";
import ActionsDropDown from "./actions-dropdown";
import { Badge } from "./ui/badge";

export function YoloDashboard() {
  const trainingJobs = useQuery(
    api.trainingJobs.getAllTrainingJobsWithUrls,
    {}
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const testFileRef = useRef<HTMLInputElement>(null);
  const updateTrainingJobNotification = useMutation(
    api.trainingJobs.updateTrainingJobNotification
  );

  useEffect(() => {
    const checkNotification = async () => {
      if (trainingJobs && trainingJobs.length > 0) {
        const latestJob = trainingJobs[0];
        if (latestJob.status === "segmented" && !latestJob.notified) {
          toast.success("Completed Job", {
            description: `${latestJob.jobName} segmented successfully.`,
          });

          await updateTrainingJobNotification({
            id: latestJob._id,
            notified: true,
          });
        }
      }
    };
    checkNotification();
  }, [trainingJobs, updateTrainingJobNotification]);

  const handleVideoFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      setVideoFile(event.target.files[0]);
    }
  };

  const handleTestFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setTestFile(event.target.files[0]);
    }
  };

  const filteredJobs =
    trainingJobs?.filter((job) =>
      job.jobName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ) ?? [];

  const clearFileInput = () => {
    if (videoFileRef.current) {
      videoFileRef.current.value = "";
    }
    if (testFileRef.current) {
      testFileRef.current.value = "";
    }
  };

  const handleExport = () => {
    const csvContent = [
      [
        "ID",
        "Name",
        "Status",
        "Segmenting Progress",
        "Training Progress",
        "Created At",
      ],
      ...filteredJobs.map((job) => [
        job._id,
        job.jobName,
        job.status,
        job.segmentingProgress,
        job.trainingProgress,
        job._creationTime,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "yolo_training_jobs.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <form
        className="grid gap-y-4"
        action={async (formData) => {
          const response = await startSegmenting(formData);
          if (response.error) {
            toast.error(response.error);
          } else {
            toast.success(
              "Video uploaded and training job created successfully."
            );
            setVideoFile(null);
            setTestFile(null);
            clearFileInput();
            setDescription("");
          }
        }}
      >
        <div className="flex md:gap-x-4 flex-col md:flex-row gap-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="video-upload">Upload Suspicious Video</Label>
            <Input
              id="video-upload"
              type="file"
              accept="video/*"
              name="video"
              onChange={handleVideoFileChange}
              ref={videoFileRef}
            />
            <p className="text-sm text-muted-foreground">
              Upload videos to train the YOLO v11 model for suspicious behavior
              detection.
            </p>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="video-upload">Upload Test Dataset</Label>
            <Input
              id="test-upload"
              type="file"
              accept=".zip"
              name="test"
              onChange={handleTestFileChange}
              ref={testFileRef}
            />
            <p className="text-sm text-muted-foreground">
              Upload a zip file containing test images to evaluate the model.
            </p>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="video-description">Enter Object Description</Label>
            <Input
              id="video-description"
              name="description"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />
            <p className="text-sm text-muted-foreground">
              Enter the object description to mask and train the YOLO v11 model.
            </p>
          </div>
        </div>
        <TrainingFormButton fileSelected={!!videoFile && !!testFile} />
      </form>

      <div className="flex flex-col gap-y-5 items-start md:flex-row md:justify-between">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search training jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-[300px]"
          />
        </div>
        <Button onClick={handleExport}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Segmenting Progress</TableHead>
            <TableHead>Training Progress</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.map((job) => (
            <TableRow key={job._id}>
              <TableCell>{job.jobName}</TableCell>
              <TableCell>
                <Badge className="w-24">
                  <p className="text-center w-full">{job.status}</p>
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className="bg-green-600 hover:bg-green-600/80 w-20">
                  <p className="text-center w-full">{job.environment}</p>
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={job.segmentingProgress}
                    className="w-[60%]"
                  />
                  <span>{job.segmentingProgress}%</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={job.trainingProgress} className="w-[60%]" />
                  <span>{job.trainingProgress}%</span>
                </div>
              </TableCell>
              <TableCell className="">
                {new Date(job._creationTime).toLocaleString()}
              </TableCell>
              <TableCell>
                <ActionsDropDown job={job} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
