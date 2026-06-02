"use client";

import { Menu, Bell, Sun, Moon, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/students":   "Students",
  "/teachers":   "Teachers",
  "/classes":    "Classes",
  "/subjects":   "Subjects",
  "/attendance": "Attendance",
  "/grades":     "Grades",
  "/files":      "Files",
  "/settings":   "Settings",
};

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [dropOpen, setDropOpen] = useState(false);

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "School ERP";

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-20 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-4">
      {/* Mobile hamburger */}
      <button
        id="sidebar-toggle"
        onClick={onMenuClick}
        className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="font-semibold text-foreground text-lg flex-1">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications placeholder */}
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            id="user-menu"
            onClick={() => setDropOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user ? getInitials(user.name) : "?"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </button>

          {dropOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-fadeIn">
                <a
                  href="/settings"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition"
                  onClick={() => setDropOpen(false)}
                >
                  <User className="w-4 h-4 text-muted-foreground" /> Profile & Settings
                </a>
                <hr className="my-1 border-border" />
                <button
                  id="logout-btn"
                  onClick={() => { setDropOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
