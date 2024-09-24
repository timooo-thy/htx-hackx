import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "update training progress",
  { minutes: 1 },
  internal.trainingJobs.updateTrainingJobProgress
);

export default crons;
