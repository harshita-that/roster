import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getGradeColor(grade?: string): string {
  const map: Record<string, string> = {
    "A+": "text-emerald-600",
    A: "text-emerald-500",
    "B+": "text-blue-600",
    B: "text-blue-500",
    "C+": "text-yellow-600",
    C: "text-yellow-500",
    D: "text-orange-500",
    F: "text-red-500",
  };
  return map[grade ?? ""] ?? "text-slate-500";
}

export function attendanceStatusColor(status: string) {
  const map: Record<string, string> = {
    PRESENT: "bg-emerald-100 text-emerald-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-yellow-100 text-yellow-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

export function getMimeIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  return "📁";
}

export function calcPercentage(val: number, max: number): number {
  if (!max) return 0;
  return Math.round((val / max) * 100);
}
