import { TabsType } from "./types";

export const statsCardData = [
  {
    title: "Total Incidents",
    value: 1234,
    description: "+20.1% from last month",
    tab: "incidents" as TabsType,
  },
  {
    title: "Open Cases",
    value: 423,
    description: "-3.2% from last month",
    tab: "cases" as TabsType,
  },
  {
    title: "Officers on Duty",
    value: 78,
    description: "+2 from last shift",
    tab: "officers" as TabsType,
  },
  {
    title: "Emergency Calls",
    value: 29,
    description: "+7 in last hour",
    tab: "calls" as TabsType,
  },
];

export const recentActivities = [
  {
    id: 1,
    type: "Emergency Call",
    description: "Reported break-in at Pasir Panjang",
    timestamp: "10 minutes ago",
    officer: "Amanda Lee",
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    type: "Patrol Update",
    description: "Suspicious activity reported near Orchard Road",
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
  {
    id: 4,
    type: "Emergency Call",
    description: "Reported robbery at Jurong East",
    timestamp: "10 minutes ago",
    officer: "John Doe",
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    type: "Patrol Update",
    description: "Suspicious activity reported near Kallang",
    timestamp: "25 minutes ago",
    officer: "Jane Smith",
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 6,
    type: "Case Update",
    description: "New evidence submitted for Case #3412",
    timestamp: "1 hour ago",
    officer: "Mary Hill",
    avatarUrl: "/placeholder.svg?height=40&width=40",
  },
];
