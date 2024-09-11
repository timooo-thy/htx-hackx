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

export function RecentActivity() {
  return (
    <Card className="col-span-3 h-full w-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>You have 3 new alerts</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="h-96 overflow-y-scroll pt-4">
        <div className="space-y-8">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.avatarUrl} alt={activity.officer} />
                <AvatarFallback>
                  {activity.officer
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.type}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp} by {activity.officer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
