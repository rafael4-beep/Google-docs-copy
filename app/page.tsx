import TopBar from "@/components/TopBar";
import DashboardClient from "@/components/DashboardClient";
import { getCurrentUser } from "@/lib/auth";
import { listUsers, listDocumentsForUser } from "@/lib/repo";

// The dashboard is a server component: it reads the current user and their
// documents directly from the store, then hands them to a client component for
// interactivity. `force-dynamic` ensures the cookie (current user) is always read.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const users = listUsers();
  const { owned, shared } = listDocumentsForUser(currentUser.id);

  return (
    <div className="min-h-screen">
      <TopBar currentUser={currentUser} users={users} />
      <DashboardClient owned={owned} shared={shared} currentUser={currentUser} />
    </div>
  );
}
