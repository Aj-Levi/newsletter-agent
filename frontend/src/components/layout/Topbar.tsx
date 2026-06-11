"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useZustandStore } from "@/lib/ZustandStore";
import { Menu, Sun, Moon, Bell } from "lucide-react";

interface TopbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
}

const Topbar = ({ user }: TopbarProps) => {
  const pathname = usePathname();
  const { currentTheme, toggleTheme } = useZustandStore();

  const getPageTitle = (path: string) => {
    if (path === "/dashboard") return "Dashboard";
    if (path === "/subscriptions") return "My Subscriptions";
    if (path === "/subscriptions/new") return "Create Subscription";
    if (path.startsWith("/subscriptions/") && path.endsWith("/edit")) {
      return "Edit Subscription";
    }
    if (path.startsWith("/subscriptions/")) return "Subscription Details";
    if (path === "/analytics") return "Analytics Overview";
    if (path === "/settings") return "Account Settings";
    return "Dashboard";
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "?";
  };

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4 md:px-8 py-3 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
      {/* Left side: Hamburger (mobile) & dynamic page title */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="dashboard-sidebar-drawer"
          className="btn btn-ghost btn-square lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5 text-base-content" />
        </label>
        
        <h1 className="text-xl md:text-2xl font-bold text-base-content ml-1 tracking-tight">
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Right side: theme toggle, notifications, and profile indicator */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle text-base-content transition-transform hover:rotate-12 duration-200"
          aria-label="Toggle theme"
        >
          {currentTheme === "abyss" ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
        </button>

        {/* Notifications (Mock/Future scope) */}
        <button
          className="btn btn-ghost btn-circle text-base-content/75 hover:text-base-content relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* <span className="badge badge-primary badge-xs absolute top-2.5 right-2.5"></span> */}
        </button>

        {/* User Avatar Circle */}
        <div className="avatar placeholder ml-2">
          {user?.avatarUrl ? (
            <div className="w-9 h-9 rounded-full ring-2 ring-primary/20">
              <img src={user.avatarUrl} alt={user.name || "User Avatar"} />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary text-primary-content font-semibold text-md ring-2 ring-primary/20 flex items-center justify-center">
              {getInitials(user?.name, user?.email)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
