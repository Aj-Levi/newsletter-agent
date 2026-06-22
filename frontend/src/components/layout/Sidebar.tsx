"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Rss, BarChart3, Settings, Mail } from "lucide-react";
import SignOut from "@/components/auth/SignOut";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  onCloseMobile?: () => void; // Optional callback to close mobile drawer on link click
}

const Sidebar = ({ user, onCloseMobile }: SidebarProps) => {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Subscriptions",
      href: "/subscriptions",
      icon: Rss,
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <div className="flex flex-col h-full bg-base-200 border-r border-base-300 text-base-content w-72">
      {/* Brand logo header */}
      <div className="flex items-center gap-2 px-6 py-6 border-b border-base-300">
        <div className="bg-primary text-primary-content p-2 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            HireLoop
          </span>
          <span className="block text-xs text-base-content/60 font-medium -mt-1">
            Autonomous Insights
          </span>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-grow py-6 px-4 space-y-1 overflow-y-auto">
        <ul className="menu menu-md w-full p-0 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Exact match for /dashboard, startsWith for /subscriptions, /analytics, /settings
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-secondary text-secondary-content font-semibold shadow-md shadow-secondary/20"
                      : "hover:bg-base-300 hover:text-base-content/90 text-base-content/70"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-secondary-content" : "text-base-content/60 group-hover:text-primary"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile & Footer section */}
      <div className="p-4 border-t border-base-300 bg-base-300/40">
        <div className="flex items-center gap-3 px-2 py-2">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || "User Avatar"}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-md shadow-inner shadow-black/25">
              {getInitials(user?.name, user?.email)}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <h4 className="font-semibold text-sm truncate text-base-content">
              {user?.name || "User Account"}
            </h4>
            <p className="text-xs text-base-content/60 truncate">
              {user?.email || "No email info"}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <SignOut />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
