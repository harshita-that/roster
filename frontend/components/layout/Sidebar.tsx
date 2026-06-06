"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCog, BookOpen, School,
  ClipboardList, BarChart3, FolderOpen, Settings,
  GraduationCap, X, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Nav Structure ─────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER", "STUDENT"] },
    ],
  },
  {
    label: "Academic",
    items: [
      { href: "/students",   label: "Students",   icon: Users,         roles: ["ADMIN", "TEACHER"] },
      { href: "/teachers",   label: "Teachers",   icon: UserCog,       roles: ["ADMIN"] },
      { href: "/classes",    label: "Classes",    icon: School,        roles: ["ADMIN", "TEACHER"] },
      { href: "/subjects",   label: "Subjects",   icon: BookOpen,      roles: ["ADMIN", "TEACHER"] },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/attendance", label: "Attendance", icon: ClipboardList, roles: ["ADMIN", "TEACHER", "STUDENT"] },
      { href: "/grades",     label: "Grades",     icon: BarChart3,     roles: ["ADMIN", "TEACHER", "STUDENT"] },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/files", label: "Files", icon: FolderOpen, roles: ["ADMIN", "TEACHER", "STUDENT"] },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "TEACHER", "STUDENT"] },
    ],
  },
];

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  ADMIN:   { label: "Admin",   cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  TEACHER: { label: "Teacher", cls: "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400"   },
  STUDENT: { label: "Student", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "STUDENT";
  const roleBadge = ROLE_BADGE[role];

  const content = (
    <div className="sidebar flex flex-col h-full w-60 flex-shrink-0">

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
            School ERP
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((i) => i.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-1">
              <p className="sidebar-section-label">{group.label}</p>
              <div className="space-y-0.5">
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={cn("sidebar-link group", active && "active")}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{label}</span>
                      {active && (
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-default">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {(user?.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
              {user?.name ?? "User"}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
          </div>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0", roleBadge?.cls)}>
            {roleBadge?.label}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30">{content}</aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 z-50 lg:hidden animate-slideIn">{content}</aside>
        </>
      )}
    </>
  );
}
