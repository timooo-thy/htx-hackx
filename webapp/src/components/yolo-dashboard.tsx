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
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDebounce } from "@/lib/hooks";
import { startTraining } from "@/actions/trainingActions";
import { toast } from "sonner";
import TrainingFormButton from "./training-form-button";
import ActionsDropDown from "./actions-dropdown";

export function YoloDashboard() {
  const trainingJobs = useQuery(
    api.trainingJobs.getAllTrainingJobsWithUrls,
    {}
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVideoFile(event.target.files[0]);
    }
  };

  // const handleUpload = async () => {
  //   if (!videoFile) {
  //     toast.error("Please select a video file to upload.");
  //     return;
  //   }

  //   // Simulate file upload and job creation
  //   const newJob: TrainingJob = {
  //     id: String(trainingJobs.length + 1),
  //     name: videoFile.name,
  //     status: "queued",
  //     progress: 0,
  //     createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  //   };

  //   setTrainingJobs((prev) => [...prev, newJob]);
  //   setVideoFile(null);

  //   toast.success("Video uploaded and training job created successfully.");

  //   // Simulate training progress
  //   let progress = 0;
  //   const intervalId = setInterval(() => {
  //     progress += 10;
  //     setTrainingJobs((prev) =>
  //       prev.map((job) =>
  //         job.id === newJob.id
  //           ? {
  //               ...job,
  //               status: progress < 100 ? "training" : "completed",
  //               progress: Math.min(progress, 100),
  //             }
  //           : job
  //       )
  //     );
  //     if (progress >= 100) {
  //       clearInterval(intervalId);
  //     }
  //   }, 2000);
  // };

  const filteredJobs =
    trainingJobs?.filter((job) =>
      job.jobName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ) ?? [];

  const clearFileInput = () => {
    if (videoFileRef.current) {
      videoFileRef.current.value = "";
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
          const response = await startTraining(formData);
          if (response.error) {
            toast.error(response.error);
          } else {
            toast.success(
              "Video uploaded and training job created successfully"
            );
            setVideoFile(null);
            clearFileInput();
            setDescription("");
          }
        }}
      >
        <div className="flex gap-x-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="video-upload">Upload Suspicious Video</Label>
            <Input
              id="video-upload"
              type="file"
              accept="video/*"
              name="video"
              onChange={handleFileChange}
              ref={videoFileRef}
            />
            <p className="text-sm text-muted-foreground">
              Upload videos to train the YOLOv8 model for suspicious behavior
              detection.
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
              Enter the object description to mask and train the YOLOv8 model
              for suspicious object detection.
            </p>
          </div>
        </div>
        <TrainingFormButton fileSelected={!!videoFile} />
      </form>

      <div className="flex justify-between items-center">
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
              <TableCell>{job.status}</TableCell>
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
