import { MainDashboard } from "@/components/main-dashboard";
import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();
  return (
    <main className="min-h-dvh w-5/6 m-auto">
      <h2 className="text-3xl font-bold tracking-tight pt-4">
        Welcome {user?.fullName}
      </h2>
      <MainDashboard />
    </main>
  );
}
