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

export const tabsOverviewData = {
  incidents: {
    keyName: "incidents" as TabsType,
    label: "Incidents",
    title: "Overview of Incidents",
    chartData: [
      { month: "Jan", incidents: 200 },
      { month: "Feb", incidents: 250 },
      { month: "Mar", incidents: 300 },
      { month: "Apr", incidents: 350 },
      { month: "May", incidents: 400 },
      { month: "Jun", incidents: 534 },
    ],
    color: "1",
  },
  cases: {
    keyName: "cases" as TabsType,
    label: "Open Cases",
    title: "Overview of Open Cases",
    chartData: [
      { month: "Jan", cases: 100 },
      { month: "Feb", cases: 70 },
      { month: "Mar", cases: 50 },
      { month: "Apr", cases: 80 },
      { month: "May", cases: 70 },
      { month: "Jun", cases: 53 },
    ],
    color: "2",
  },
  officers: {
    keyName: "officers" as TabsType,
    label: "Officers",
    title: "Overview of Officers",
    chartData: [
      { month: "Jan", officers: 12 },
      { month: "Feb", officers: 13 },
      { month: "Mar", officers: 12 },
      { month: "Apr", officers: 15 },
      { month: "May", officers: 15 },
      { month: "Jun", officers: 11 },
    ],
    color: "3",
  },
  calls: {
    keyName: "calls" as TabsType,
    label: "Calls",
    title: "Overview of Calls",
    chartData: [
      { month: "Jan", calls: 100 },
      { month: "Feb", calls: 120 },
      { month: "Mar", calls: 150 },
      { month: "Apr", calls: 180 },
      { month: "May", calls: 160 },
      { month: "Jun", calls: 69 },
    ],
    color: "4",
  },
};

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
