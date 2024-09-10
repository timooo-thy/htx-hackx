import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const recentActivities = [
  {
    id: 1,
    type: "Emergency Call",
    description: "Reported break-in at 456 Elm St",
    timestamp: "10 minutes ago",
    officer: "John Doe",
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    type: "Patrol Update",
    description: "Suspicious activity reported near Central Park",
    timestamp: "25 minutes ago",
    officer: "Jane Smith",
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    type: "Case Update",
    description: "New evidence submitted for Case #2345",
    timestamp: "1 hour ago",
    officer: "Mike Johnson",
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
];

export function RecentActivity() {
  return (
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
            <p className="text-sm font-medium leading-none">{activity.type}</p>
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
  );
}
