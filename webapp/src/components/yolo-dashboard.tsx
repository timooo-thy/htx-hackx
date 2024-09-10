"use client";

import { useState } from "react";
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
import { toast } from "sonner";

type TrainingJob = {
  id: string;
  name: string;
  status: "queued" | "training" | "completed" | "failed";
  progress: number;
  createdAt: string;
};

export function YoloDashboard() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([
    {
      id: "1",
      name: "Suspicious behavior model",
      status: "completed",
      progress: 100,
      createdAt: "2023-06-15 09:30",
    },
    {
      id: "2",
      name: "Object detection model",
      status: "training",
      progress: 65,
      createdAt: "2023-06-15 14:45",
    },
  ]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVideoFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error("Please select a video file to upload.");
      return;
    }

    // Simulate file upload and job creation
    const newJob: TrainingJob = {
      id: String(trainingJobs.length + 1),
      name: videoFile.name,
      status: "queued",
      progress: 0,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    setTrainingJobs((prev) => [...prev, newJob]);
    setVideoFile(null);

    toast.success("Video uploaded and training job created successfully.");

    // Simulate training progress
    let progress = 0;
    const intervalId = setInterval(() => {
      progress += 10;
      setTrainingJobs((prev) =>
        prev.map((job) =>
          job.id === newJob.id
            ? {
                ...job,
                status: progress < 100 ? "training" : "completed",
                progress: Math.min(progress, 100),
              }
            : job
        )
      );
      if (progress >= 100) {
        clearInterval(intervalId);
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="video-upload">Upload Suspicious Video</Label>
        <Input
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
        />
        <p className="text-sm text-muted-foreground">
          Upload videos to train the YOLOv8 model for suspicious behavior
          detection.
        </p>
      </div>
      <Button onClick={handleUpload} disabled={!videoFile}>
        Upload and Start Training
      </Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainingJobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.name}</TableCell>
              <TableCell>{job.status}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={job.progress} className="w-[60%]" />
                  <span>{job.progress}%</span>
                </div>
              </TableCell>
              <TableCell>{job.createdAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
