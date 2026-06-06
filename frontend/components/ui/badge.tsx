import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "red" | "amber" | "purple" | "gray" | "cyan";
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span className={cn("badge", `badge-${variant}`, className)}>
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    ADMIN:   { label: "Admin",   variant: "purple" },
    TEACHER: { label: "Teacher", variant: "blue" },
    STUDENT: { label: "Student", variant: "green" },
  };
  const cfg = map[role] ?? { label: role, variant: "gray" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function GenderBadge({ gender }: { gender: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    MALE:   { label: "Male",   variant: "blue" },
    FEMALE: { label: "Female", variant: "purple" },
    OTHER:  { label: "Other",  variant: "gray" },
  };
  const cfg = map[gender] ?? { label: gender, variant: "gray" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    PRESENT: { label: "Present", variant: "green" },
    ABSENT:  { label: "Absent",  variant: "red" },
    LATE:    { label: "Late",    variant: "amber" },
    ACTIVE:  { label: "Active",  variant: "green" },
    INACTIVE:{ label: "Inactive",variant: "gray" },
    PAID:    { label: "Paid",    variant: "green" },
    PENDING: { label: "Pending", variant: "amber" },
    OVERDUE: { label: "Overdue", variant: "red" },
  };
  const cfg = map[status?.toUpperCase()] ?? { label: status, variant: "gray" };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function ExamBadge({ type }: { type: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    MIDTERM:    "blue",
    FINAL:      "purple",
    QUIZ:       "cyan",
    ASSIGNMENT: "amber",
    PROJECT:    "green",
  };
  return <Badge variant={map[type] ?? "gray"}>{type}</Badge>;
}
