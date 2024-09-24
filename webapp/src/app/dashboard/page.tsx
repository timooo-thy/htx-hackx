import { checkRole } from "@/actions/utils";
import { MainDashboard } from "@/components/main-dashboard";
import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const isAdmin = checkRole("admin");
  const user = await currentUser();

  return (
    <main className="w-5/6 m-auto pb-8 min-h-[calc(100vh-144px)]">
      <MainDashboard userName={user?.firstName ?? ""} isAdmin={isAdmin} />
    </main>
  );
}
