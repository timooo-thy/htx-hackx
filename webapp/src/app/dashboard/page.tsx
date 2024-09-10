import { MainDashboard } from "@/components/main-dashboard";
import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();
  return (
    <main className="min-h-[calc(min-h-dvh-80px)] w-5/6 m-auto">
      <MainDashboard userName={user?.firstName ?? ""} />
    </main>
  );
}
