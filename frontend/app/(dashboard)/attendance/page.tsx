"use client";

import { useEffect, useState } from "react";
import { attendanceService } from "@/services/attendance.service";
import { classService } from "@/services/class.service";
import { studentService } from "@/services/student.service";
import type { Class, Student, AttendanceRecord, AttendanceStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { Loader2, Save, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE"];

const STATUS_META: Record<AttendanceStatus, { label: string; icon: React.ElementType; activeClass: string; bg: string; text: string }> = {
  PRESENT: {
    label: "Present",
    icon: CheckCircle2,
    activeClass: "ring-2 ring-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  ABSENT: {
    label: "Absent",
    icon: XCircle,
    activeClass: "ring-2 ring-red-400 bg-red-50 dark:bg-red-950/30",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
  },
  LATE: {
    label: "Late",
    icon: Clock,
    activeClass: "ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/30",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
  },
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"mark" | "history">("mark");
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    classService.getAll({ limit: 100 }).then((r) => {
      setClasses(Array.isArray(r) ? r : (r as { data: Class[] }).data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    let cancelled = false;
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await studentService.getAll({ classId: selectedClass, limit: 100 });
        if (!cancelled) {
          const rows = Array.isArray(res) ? res : (res as { data: Student[] }).data ?? [];
          setStudents(rows);
          const init: Record<string, AttendanceStatus> = {};
          rows.forEach((s) => { init[s.id] = "PRESENT"; });
          setAttendance(init);
        }
      } catch { if (!cancelled) toast("Failed to load students", { variant: "destructive" }); }
      finally { if (!cancelled) setLoadingStudents(false); }
    };
    loadStudents();
    return () => { cancelled = true; };
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;
    let cancelled = false;
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await attendanceService.getAll({ classId: selectedClass, limit: 50 });
        if (!cancelled) {
          const rows = (res as { data?: AttendanceRecord[] }).data ?? (Array.isArray(res) ? res : []);
          setHistory(rows);
        }
      } catch { if (!cancelled) toast("Failed to load history", { variant: "destructive" }); }
      finally { if (!cancelled) setLoadingHistory(false); }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [selectedClass, fetchKey]);

  const handleSave = async () => {
    if (!selectedClass || !selectedDate) { toast("Select class and date", { variant: "destructive" }); return; }
    setSaving(true);
    try {
      await attendanceService.markBulk({
        classId: selectedClass,
        date: selectedDate,
        records: students.map((s) => ({ studentId: s.id, status: attendance[s.id] ?? "PRESENT" })),
      });
      toast("Attendance saved!", { variant: "success" });
      setFetchKey((k) => k + 1);
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save", { variant: "destructive" });
    }
    finally { setSaving(false); }
  };

  const counts = students.reduce((acc, s) => {
    const st = attendance[s.id] ?? "PRESENT";
    acc[st] = (acc[st] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Attendance</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Mark and view attendance records</p>
      </div>

      {/* Filter bar */}
      <div className="erp-card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wide">Select Class</label>
            <Select onValueChange={setSelectedClass} value={selectedClass}>
              <SelectTrigger><SelectValue placeholder="Choose a class…" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition"
            />
          </div>
          {/* Tab switcher */}
          <div className="ml-auto flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-1">
            {(["mark", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              >
                {t === "mark" ? "Mark Attendance" : "History"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mark Attendance tab */}
      {tab === "mark" && (
        <>
          {/* Summary cards */}
          {students.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {(["PRESENT", "ABSENT", "LATE"] as AttendanceStatus[]).map((st) => {
                const meta = STATUS_META[st];
                const Icon = meta.icon;
                return (
                  <div key={st} className={`erp-card p-4 flex items-center gap-4`}>
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${meta.text}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold leading-none ${meta.text}`}>{counts[st] ?? 0}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{meta.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="erp-card overflow-hidden">
            {!selectedClass ? (
              <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">Select a class to mark attendance</p>
                <p className="text-xs mt-1">Choose a class and date from the filter above</p>
              </div>
            ) : loadingStudents ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-20 text-zinc-400 dark:text-zinc-500 text-sm">No students in this class</div>
            ) : (
              <>
                {/* Table toolbar */}
                <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {students.length} students
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{formatDate(selectedDate)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { const u = { ...attendance }; students.forEach((s) => { u[s.id] = "PRESENT"; }); setAttendance(u); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition font-medium"
                    >
                      All Present
                    </button>
                    <button
                      onClick={() => { const u = { ...attendance }; students.forEach((s) => { u[s.id] = "ABSENT"; }); setAttendance(u); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition font-medium"
                    >
                      All Absent
                    </button>
                  </div>
                </div>

                {/* Attendance table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-10">#</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-20">Roll No</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Student Name</th>
                        {STATUSES.map((st) => (
                          <th key={st} className={`text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider ${STATUS_META[st].text}`}>
                            {STATUS_META[st].label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                      {students.map((s, i) => (
                        <tr key={s.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition">
                          <td className="px-5 py-3 text-xs text-zinc-400">{i + 1}</td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md">{s.rollNumber ?? "—"}</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xs font-bold flex-shrink-0">
                                {s.name.charAt(0)}
                              </div>
                              <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{s.name}</span>
                            </div>
                          </td>
                          {STATUSES.map((st) => (
                            <td key={st} className="text-center px-4 py-3">
                              <button
                                onClick={() => setAttendance((prev) => ({ ...prev, [s.id]: st }))}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center mx-auto transition ${
                                  attendance[s.id] === st
                                    ? `${STATUS_META[st].activeClass} border-transparent`
                                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                }`}
                                title={STATUS_META[st].label}
                              >
                                {attendance[s.id] === st && (
                                  <div className={`w-3 h-3 rounded-full ${
                                    st === "PRESENT" ? "bg-emerald-500" : st === "ABSENT" ? "bg-red-500" : "bg-amber-500"
                                  }`} />
                                )}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <Button icon={<Save className="w-4 h-4" />} onClick={handleSave} loading={saving} id="save-attendance-btn">
                    Save Attendance
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="erp-card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Attendance History</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Last 50 records for selected class</p>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm">
              {selectedClass ? "No attendance records found" : "Select a class to view history"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                  {history.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition">
                      <td className="px-5 py-3 font-medium text-sm text-zinc-800 dark:text-zinc-200">{r.student?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-sm text-zinc-500">{formatDate(r.date)}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-sm text-zinc-500">{r.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
