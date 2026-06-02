import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
}

const variants = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  danger:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  purple:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("badge", variants[variant], className)}>
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    ADMIN: "purple",
    TEACHER: "info",
    STUDENT: "success",
  };
  return <Badge variant={map[role] ?? "default"}>{role}</Badge>;
}

export function GenderBadge({ gender }: { gender: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    MALE: "info",
    FEMALE: "purple",
    OTHER: "default",
  };
  return <Badge variant={map[gender] ?? "default"}>{gender}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    PRESENT: "success",
    ABSENT: "danger",
    LATE: "warning",
  };
  return <Badge variant={map[status] ?? "default"}>{status}</Badge>;
}
