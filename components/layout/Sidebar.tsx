"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCog, BookOpen, School,
  ClipboardList, BarChart3, FolderOpen, Settings, GraduationCap, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const ALL_NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, roles: ["ADMIN","TEACHER","STUDENT"] },
  { href: "/students",   label: "Students",   icon: Users,           roles: ["ADMIN","TEACHER"] },
  { href: "/teachers",   label: "Teachers",   icon: UserCog,         roles: ["ADMIN"] },
  { href: "/classes",    label: "Classes",    icon: School,          roles: ["ADMIN","TEACHER"] },
  { href: "/subjects",   label: "Subjects",   icon: BookOpen,        roles: ["ADMIN","TEACHER"] },
  { href: "/attendance", label: "Attendance", icon: ClipboardList,   roles: ["ADMIN","TEACHER","STUDENT"] },
  { href: "/grades",     label: "Grades",     icon: BarChart3,       roles: ["ADMIN","TEACHER","STUDENT"] },
  { href: "/files",      label: "Files",      icon: FolderOpen,      roles: ["ADMIN","TEACHER","STUDENT"] },
  { href: "/settings",   label: "Settings",   icon: Settings,        roles: ["ADMIN","TEACHER","STUDENT"] },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin Portal",
  TEACHER: "Teacher Portal",
  STUDENT: "Student Portal",
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "STUDENT";
  const nav = ALL_NAV.filter((n) => n.roles.includes(role));

  const content = (
    <div className="sidebar flex flex-col h-full w-64 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">School ERP</div>
            <div className="text-slate-500 text-xs">{ROLE_LABELS[role]}</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 px-2 mb-3">
          Navigation
        </p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn("sidebar-link", active && "active")}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">{user?.name}</p>
            <p className="text-xs text-slate-600 capitalize">{role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 z-50 lg:hidden">
            {content}
          </aside>
        </>
      )}
    </>
  );
}
