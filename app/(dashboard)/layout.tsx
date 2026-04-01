import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { TopBar } from "@/components/dashboard/top-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex">
      <Sidebar />
      <main className="flex-1 lg:ml-[250px] pb-20 lg:pb-0">
        <TopBar />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
