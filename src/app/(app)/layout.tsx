import { redirect } from "next/navigation";
import { getCurrentUser } from "../../server/auth";
import { Sidebar } from "../../components/navigation/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden bg-[#FFFFFF]">
      <Sidebar user={user} />
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto pb-12">{children}</div>
      </main>
    </div>
  );
}
