import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { recentActivities } from "@/lib/data";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function RecentActivity() {
  const activities = useQuery(api.activity.getAllActivities, {});

  return (
    <Card className="col-span-3 h-full w-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          You have {activities?.length ?? 0} new alerts
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="h-96 overflow-y-scroll pt-4">
        <div className="space-y-8">
          {activities?.map((activity) => (
            <div key={activity._id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage alt={activity.officerId} />
                <AvatarFallback>
                  {activity.officerName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity._creationTime).toLocaleString()} by{" "}
                  {activity.officerName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
