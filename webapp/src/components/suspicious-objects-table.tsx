"use client";

import { useState } from "react";
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
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function SuspiciousObjectsTable() {
  const objects = useQuery(api.activity.getSuspiciousActivities, {});
  const [searchTerm, setSearchTerm] = useState("");

  // const handleEvaluate = async (id: string) => {
  //   // Simulate AI evaluation
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   setObjects((prevObjects) =>
  //     prevObjects.map((obj) =>
  //       obj.id === id
  //         ? {
  //             ...obj,
  //             status: "evaluated",
  //             aiEvaluation: "Low risk. Further investigation recommended.",
  //           }
  //         : obj
  //     )
  //   );
  // };

  const filteredObjects =
    objects?.filter(
      (obj) =>
        obj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.location.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex justify-between items-center">
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
            <TableHead>Reported At</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
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
                    <Image
                      src={object.imageUrl ?? ""}
                      alt="Suspicious object"
                      width="100"
                      height="100"
                    />
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    object.status === "pending" ? "destructive" : "secondary"
                  }
                >
                  {object.status}
                </Badge>
              </TableCell>
              <TableCell>
                {object.status === "pending" ? (
                  <Button>Evaluate</Button>
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
