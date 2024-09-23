import { FunctionReturnType } from "convex/server";
import { use, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { EllipsisVerticalIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import Image from "next/image";
import { useMutation } from "convex/react";
import { toast } from "sonner";

type ActionsDropDownProps = {
  job: FunctionReturnType<
    typeof api.trainingJobs.getAllTrainingJobsWithUrls
  >[number];
};
export default function ActionsDropDown({ job }: ActionsDropDownProps) {
  const [current, setCurrent] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const updateTrainingJob = useMutation(api.trainingJobs.updateTrainingJob);

  const handleTraining = async () => {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await updateTrainingJob({
        _id: job._id,
        trainingProgress: i,
      });
    }
    await updateTrainingJob({
      _id: job._id,
      status: "trained",
    });
    toast.success("Training completed successfully.");
  };

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
                Masked Image {current} of {job.imageUrls.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <DropdownMenuItem
          className="text-xs h-[32px]"
          disabled={job.status !== "completed"}
          onClick={handleTraining}
        >
          {job.status === "completed" || job.status === "segmenting"
            ? "Start Training"
            : job.status === "deployed" || job.status === "trained"
              ? "Trained"
              : "Training..."}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
