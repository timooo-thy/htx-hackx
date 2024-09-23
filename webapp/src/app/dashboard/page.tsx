import { checkRole } from "@/actions/utils";
import { MainDashboard } from "@/components/main-dashboard";
import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const isAdmin = checkRole("admin");
  const user = await currentUser();

  return (
    <main className="min-h-[calc(min-h-dvh-80px)] w-5/6 m-auto pb-8">
      <MainDashboard userName={user?.firstName ?? ""} isAdmin={isAdmin} />
    </main>
  );
}
