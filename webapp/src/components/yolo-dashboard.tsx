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
import { DownloadIcon, SearchIcon } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredJobs = trainingJobs.filter((job) =>
    job.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Status", "Progress", "Created At"],
      ...filteredJobs.map((job) => [
        job.id,
        job.name,
        job.status,
        job.progress,
        job.createdAt,
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
            <TableHead>Progress</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.map((job) => (
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
