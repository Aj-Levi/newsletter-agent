import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Protect all dashboard routes server-side
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-100">
      {/* Drawer checkbox toggle for mobile view */}
      <input id="dashboard-sidebar-drawer" type="checkbox" className="drawer-toggle" />
      
      {/* Main page content area */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-100">
        <Topbar user={session.user} />
        
        <main className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Responsive sidebar wrapper */}
      <div className="drawer-side z-20">
        {/* Overlay to close sidebar on mobile when clicked outside */}
        <label
          htmlFor="dashboard-sidebar-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        
        {/* Sidebar content */}
        <Sidebar user={session.user} />
      </div>
    </div>
  );
}
