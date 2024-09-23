"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DownloadIcon, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDebounce } from "@/lib/hooks";
import { toast } from "sonner";

export function SuspiciousObjectsTable() {
  const objects = useQuery(api.activity.getSuspiciousActivities, {});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const updateActivityNotification = useMutation(
    api.activity.updateActivityNotification
  );

  useEffect(() => {
    const sendNotification = async () => {
      if (objects && objects.length > 0) {
        const latestActivity = objects[0];
        if (
          latestActivity.status === "evaluated" &&
          (latestActivity.aiEvaluationScore ?? 1) > 0.3 &&
          !latestActivity.aiNotified
        ) {
          toast.warning("Alert: AI has confirmed a suspiscious object.", {
            description: `Score: ${latestActivity.aiEvaluationScore}\n\n Evaluation: ${latestActivity.aiEvaluation}`,
          });
          await updateActivityNotification({
            id: latestActivity._id,
            aiNotified: true,
          });
        } else {
          if (!latestActivity.initialNotified) {
            toast.info(`Alert: ${latestActivity.description}`);
            await updateActivityNotification({
              id: latestActivity._id,
              initialNotified: true,
            });
          }
        }
      }
    };
    sendNotification();
  }, [objects, updateActivityNotification]);

  const filteredObjects =
    objects?.filter(
      (obj) =>
        obj.description
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        obj.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ) ?? [];

  const handleExport = () => {
    const csvContent = [
      [
        "ID",
        "Reported At",
        "Location",
        "Description",
        "Status",
        "AI Evaluation",
      ],
      ...filteredObjects.map((obj) => [
        obj._id,
        obj._creationTime,
        obj.location,
        obj.description,
        obj.status,
        obj.aiEvaluation || "",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "suspicious_objects.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-y-5 items-start md:flex-row md:justify-between">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search objects..."
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
            <TableHead className="text-center">Reported At</TableHead>
            <TableHead className="text-center">Location</TableHead>
            <TableHead className="text-center">Description</TableHead>
            <TableHead className="text-center">Image</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredObjects.map((object) => (
            <TableRow key={object._id}>
              <TableCell>
                {new Date(object._creationTime).toLocaleString()}
              </TableCell>
              <TableCell>{object.location}</TableCell>
              <TableCell>{object.description}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">View Image</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Suspicious Object Image</DialogTitle>
                      <DialogDescription>
                        Reported at{" "}
                        {new Date(object._creationTime).toLocaleString()} -{" "}
                        {object.location}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center items-center">
                      <Image
                        src={object.imageUrl ?? ""}
                        alt="Suspicious object"
                        width="250"
                        height="200"
                        quality={100}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell>
                <Badge
                  className={`${object.status === "evaluated" ? "bg-green-600" : "bg-red-600"}  text-white w-full flex justify-center items-center`}
                >
                  {object.status.charAt(0).toUpperCase() +
                    object.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="">
                {object.status === "pending" ? (
                  <Button variant="outline" disabled>
                    View Evaluation
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">View Evaluation</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>AI Evaluation</DialogTitle>
                        <DialogDescription>
                          Evaluation for object reported at{" "}
                          {new Date(object._creationTime).toLocaleString()}
                        </DialogDescription>
                      </DialogHeader>
                      <p>AI Evaluation Score: {object.aiEvaluationScore}</p>
                      <p>Description: {object.aiEvaluation}</p>
                      <DialogFooter>
                        <p className="italic font-light text-xs">
                          Note that AI evaluation is not always accurate. Please
                          use this evaluation as a reference and further
                          investigate if necessary.
                        </p>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
