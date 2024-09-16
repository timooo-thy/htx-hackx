"use client";

import { useEffect, useState } from "react";
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
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { DownloadIcon, EllipsisVerticalIcon, SearchIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDebounce } from "@/lib/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { FunctionReturnType } from "convex/server";

export function YoloDashboard() {
  const trainingJobs = useQuery(
    api.trainingJobs.getAllTrainingJobsWithUrls,
    {}
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Status", "Progress", "Created At"],
      ...filteredJobs.map((job) => [
        job._id,
        job.jobName,
        job.status,
        job.progress,
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
      <form className="grid gap-y-4">
        <div className="flex gap-x-4">
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
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="video-descriptin">Enter Object Description</Label>
            <Input id="video-description" onChange={handleFileChange} />
            <p className="text-sm text-muted-foreground">
              Enter the object description to mask and train the YOLOv8 model
              for suspicious object detection.
            </p>
          </div>
        </div>
        <Button disabled={!videoFile} type="submit" className="w-[200px]">
          Upload and Mask Images
        </Button>
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
            <TableHead>Progress</TableHead>

            <TableHead className="flex justify-center items-center">
              Created At
            </TableHead>
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
                  <Progress value={job.progress} className="w-[60%]" />
                  <span>{job.progress}%</span>
                </div>
              </TableCell>
              <TableCell className="flex justify-center items-center">
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

const ActionsDropDown = ({
  job,
}: {
  job: FunctionReturnType<
    typeof api.trainingJobs.getAllTrainingJobsWithUrls
  >[number];
}) => {
  const [current, setCurrent] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCurrent(carouselApi.selectedScrollSnap() + 1);

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap() + 1);
    });
  }, [carouselApi]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" className="w-[50px]">
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              disabled={job.imageUrls.length === 0}
              variant={"ghost"}
              className="text-xs w-full px-2 py-1.5 outline-none font-normal h-[32px] justify-start"
            >
              View Images
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[425px]"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle>Masked Images</DialogTitle>
              <DialogDescription>
                Florence2 and SAM2 (Detection and Segmentation)
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center items-center flex-col">
              <Carousel className="w-4/5" setApi={setCarouselApi}>
                <CarouselContent className="w-full ml-0 pl-4">
                  {job.imageUrls.map((imageUrl) => (
                    <CarouselItem key={imageUrl}>
                      <Image
                        src={imageUrl ?? ""}
                        alt="Masked Image"
                        width="250"
                        height="200"
                        quality={100}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              <div className="py-2 text-center text-sm text-muted-foreground">
                Slide {current} of {job.imageUrls.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <DropdownMenuItem
          className="text-xs h-[32px]"
          disabled={job.status === "training"}
        >
          Start Training
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
