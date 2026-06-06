"use client";

import { Menu, Bell, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/dashboard":  { title: "Dashboard",  description: "Overview of your school" },
  "/students":   { title: "Students",   description: "Manage enrolled students" },
  "/teachers":   { title: "Teachers",   description: "Manage teaching staff" },
  "/classes":    { title: "Classes",    description: "Class and section management" },
  "/subjects":   { title: "Subjects",   description: "Curriculum subjects" },
  "/attendance": { title: "Attendance", description: "Track daily attendance" },
  "/grades":     { title: "Grades",     description: "Academic performance records" },
  "/files":      { title: "Files",      description: "Documents and resources" },
  "/settings":   { title: "Settings",   description: "Account and preferences" },
};

interface NavbarProps { onMenuClick: () => void; }

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [dropOpen, setDropOpen] = useState(false);

  const meta = Object.entries(PAGE_META).find(([k]) => pathname.startsWith(k))?.[1]
    ?? { title: "School ERP", description: "" };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-60 z-20 h-14 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center px-5 gap-4">

      {/* Mobile hamburger */}
      <button
        id="sidebar-toggle"
        onClick={onMenuClick}
        className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{meta.title}</h1>
        {meta.description && (
          <p className="text-xs text-zinc-400 hidden sm:block">{meta.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1">

        {/* Notifications */}
        <button className="relative p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full ring-1 ring-white dark:ring-zinc-950" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

        {/* User menu */}
        <div className="relative">
          <button
            id="user-menu"
            onClick={() => setDropOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition text-left",
              dropOpen
                ? "bg-zinc-100 dark:bg-zinc-800"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] text-zinc-400 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <ChevronDown className={cn("w-3 h-3 text-zinc-400 transition-transform hidden sm:block", dropOpen && "rotate-180")} />
          </button>

          {dropOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden animate-fadeIn">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{user?.name}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{user?.email}</p>
                </div>
                <a
                  href="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  onClick={() => setDropOpen(false)}
                >
                  <User className="w-3.5 h-3.5 text-zinc-400" /> Profile & Settings
                </a>
                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                <button
                  id="logout-btn"
                  onClick={() => { setDropOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
