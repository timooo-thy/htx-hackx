import { auth } from "@clerk/nextjs/server";

export default function Dashboard() {
  const { userId } = auth();
  return (
    <main className="flex flex-col items-center min-h-dvh">
      <div className="flex flex-col justify-center border h-40 w-full pl-4">
        <p>Hello {userId}!</p>
        <p>
          You are currently viewing the dashboard page. This page is only
          accessible to authenticated users.
        </p>
      </div>
    </main>
  );
}
