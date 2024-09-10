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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DownloadIcon, SearchIcon } from "lucide-react";
import Image from "next/image";

type SuspiciousObject = {
  id: string;
  reportedAt: string;
  location: string;
  description: string;
  imageUrl: string;
  status: "pending" | "evaluated" | "cleared";
  aiEvaluation?: string;
};

const mockData: SuspiciousObject[] = [
  {
    id: "1",
    reportedAt: "2023-06-15 10:30",
    location: "123 Main St",
    description: "Unattended backpack",
    imageUrl: "/placeholder.svg?height=100&width=100",
    status: "pending",
  },
  {
    id: "2",
    reportedAt: "2023-06-15 11:45",
    location: "Central Park",
    description: "Suspicious package near bench",
    imageUrl: "/placeholder.svg?height=100&width=100",
    status: "evaluated",
    aiEvaluation: "Low risk. Appears to be a discarded lunchbox.",
  },
  // Add more mock data as needed
];

export function SuspiciousObjectsTable() {
  const [objects, setObjects] = useState<SuspiciousObject[]>(mockData);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEvaluate = async (id: string) => {
    // Simulate AI evaluation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setObjects((prevObjects) =>
      prevObjects.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              status: "evaluated",
              aiEvaluation: "Low risk. Further investigation recommended.",
            }
          : obj
      )
    );
  };

  const filteredObjects = objects.filter(
    (obj) =>
      obj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        obj.id,
        obj.reportedAt,
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
            <TableRow key={object.id}>
              <TableCell>{object.reportedAt}</TableCell>
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
                        Reported at {object.reportedAt} - {object.location}
                      </DialogDescription>
                    </DialogHeader>
                    <Image
                      src={object.imageUrl}
                      alt="Suspicious object"
                      className="w-full h-auto"
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
                  <Button onClick={() => handleEvaluate(object.id)}>
                    Evaluate
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
                          Evaluation for object reported at {object.reportedAt}
                        </DialogDescription>
                      </DialogHeader>
                      <p>{object.aiEvaluation}</p>
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
