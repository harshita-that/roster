"use client";

import { useEffect, useState, useCallback } from "react";
import { attendanceService } from "@/services/attendance.service";
import { classService } from "@/services/class.service";
import { studentService } from "@/services/student.service";
import type { Class, Student, AttendanceRecord, AttendanceStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { Loader2, Save, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE"];

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

  useEffect(() => {
    classService.getAll({ limit: 100 }).then((r) => {
      setClasses(Array.isArray(r) ? r : (r as { data: Class[] }).data ?? []);
    });
  }, []);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    try {
      const res = await studentService.getAll({ classId: selectedClass, limit: 100 });
      const rows = Array.isArray(res) ? res : (res as { data: Student[] }).data ?? [];
      setStudents(rows);
      const init: Record<string, AttendanceStatus> = {};
      rows.forEach((s) => { init[s.id] = "PRESENT"; });
      setAttendance(init);
    } catch { toast("Failed to load students", { variant: "destructive" }); }
    finally { setLoadingStudents(false); }
  }, [selectedClass]);

  const loadHistory = useCallback(async () => {
    if (!selectedClass) return;
    setLoadingHistory(true);
    try {
      const res = await attendanceService.getAll({ classId: selectedClass, limit: 50 });
      const rows = (res as { data?: AttendanceRecord[] }).data ?? (Array.isArray(res) ? res : []);
      setHistory(rows);
    } catch { toast("Failed to load history", { variant: "destructive" }); }
    finally { setLoadingHistory(false); }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass) { loadStudents(); loadHistory(); }
  }, [selectedClass, loadStudents, loadHistory]);

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
      loadHistory();
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
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Attendance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Mark and view attendance records</p>
      </div>

      {/* Filters */}
      <div className="erp-card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-56">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Class</label>
            <Select onValueChange={setSelectedClass} value={selectedClass}>
              <SelectTrigger><SelectValue placeholder="Choose class…" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setTab("mark")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "mark" ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>Mark Attendance</button>
            <button onClick={() => setTab("history")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "history" ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>History</button>
          </div>
        </div>
      </div>

      {tab === "mark" && (
        <>
          {/* Summary bar */}
          {students.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Present", count: counts.PRESENT ?? 0, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
                { label: "Absent", count: counts.ABSENT ?? 0, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                { label: "Late", count: counts.LATE ?? 0, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className={`erp-card p-4 text-center ${s.color}`}>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-sm font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="erp-card overflow-hidden">
            {!selectedClass ? (
              <div className="text-center py-20 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Select a class to mark attendance</p>
              </div>
            ) : loadingStudents ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No students in this class</div>
            ) : (
              <>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{students.length} students — {formatDate(selectedDate)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { const u = { ...attendance }; students.forEach(s => { u[s.id] = "PRESENT"; }); setAttendance(u); }} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition font-medium">All Present</button>
                    <button onClick={() => { const u = { ...attendance }; students.forEach(s => { u[s.id] = "ABSENT"; }); setAttendance(u); }} className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-medium">All Absent</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full erp-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Roll No</th><th>Student Name</th>
                        {STATUSES.map(s => <th key={s}>{s}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={s.id}>
                          <td className="text-muted-foreground">{i + 1}</td>
                          <td><span className="font-mono text-xs">{s.rollNumber}</span></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold flex-shrink-0">
                                {s.name.charAt(0)}
                              </div>
                              <span className="font-medium text-sm">{s.name}</span>
                            </div>
                          </td>
                          {STATUSES.map((st) => (
                            <td key={st} className="text-center">
                              <input
                                type="radio"
                                name={`att-${s.id}`}
                                checked={attendance[s.id] === st}
                                onChange={() => setAttendance((prev) => ({ ...prev, [s.id]: st }))}
                                className="w-4 h-4 accent-indigo-600"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-border flex justify-end">
                  <Button icon={<Save className="w-4 h-4" />} onClick={handleSave} loading={saving} id="save-attendance-btn">Save Attendance</Button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="erp-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground text-sm">Attendance History</h3>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No attendance records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full erp-table">
                <thead><tr><th>Student</th><th>Date</th><th>Status</th><th>Remarks</th></tr></thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium text-sm">{r.student?.name ?? "—"}</td>
                      <td className="text-sm text-muted-foreground">{formatDate(r.date)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-sm text-muted-foreground">{r.remarks ?? "—"}</td>
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
