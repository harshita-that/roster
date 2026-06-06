"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, UserCog, School, TrendingUp, Activity, Megaphone,
  BookOpen, ClipboardCheck, GraduationCap, AlertCircle,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { authService } from "@/services/auth.service";
import { studentService } from "@/services/student.service";
import { useAuth } from "@/contexts/AuthContext";
import { CardSkeleton } from "@/components/ui/skeleton";
import { formatDate, calcPercentage } from "@/lib/utils";

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

/* ─── Shared Components ─────────────────────────────────────────────────────── */

function WelcomeBanner({ name, role }: { name: string; role: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const roleLabel = role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : "Student";
  return (
    <div className="relative overflow-hidden erp-card p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-sm font-medium">{greeting},</p>
          <h2 className="text-2xl font-bold mt-0.5">{name} 👋</h2>
          <p className="text-indigo-200 text-sm mt-1">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/20">
          <Activity className="w-4 h-4" />
          <span className="font-medium">{roleLabel} Portal</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }: { title: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${color}`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AnnouncementsPanel({ items }: { items: { id: string; title: string; content: string; createdAt: string }[] }) {
  return (
    <div className="erp-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-indigo-500" />
        <h3 className="font-semibold text-foreground">Announcements</h3>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <span className="text-3xl block mb-2">📢</span>No announcements
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="flex gap-3 p-3 bg-muted/40 rounded-xl border border-border">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm text-foreground">{a.title}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(a.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{a.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Admin Dashboard ───────────────────────────────────────────────────────── */

function AdminDashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof dashboardService.getStats>> | null>(null);
  const [chart, setChart] = useState<{ date: string; present: number; absent: number; late: number }[]>([]);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getAttendanceChart(),
      dashboardService.getAnnouncements(),
    ]).then(([s, c, a]) => { setStats(s); setChart(c); setAnnouncements(a); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Students" value={stats?.totalStudents ?? 0} sub="Enrolled" icon={<Users className="w-5 h-5" />} color="bg-gradient-to-br from-indigo-500 to-indigo-700" />
          <StatCard title="Total Teachers" value={stats?.totalTeachers ?? 0} sub="Active staff" icon={<UserCog className="w-5 h-5" />} color="bg-gradient-to-br from-cyan-500 to-cyan-700" />
          <StatCard title="Total Classes" value={stats?.totalClasses ?? 0} sub={`${stats?.totalSubjects ?? 0} subjects`} icon={<School className="w-5 h-5" />} color="bg-gradient-to-br from-emerald-500 to-emerald-700" />
          <StatCard title="Attendance Today" value={`${stats?.attendancePercentage ?? 0}%`} sub="Overall average" icon={<TrendingUp className="w-5 h-5" />} color="bg-gradient-to-br from-amber-500 to-amber-700" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 erp-card p-6">
          <h3 className="font-semibold text-foreground mb-1">Attendance Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Monthly attendance over last 6 months</p>
          {loading ? <div className="h-56 bg-muted animate-pulse rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chart.length ? chart : stats?.attendanceTrend ?? []}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="present" stroke="#6366f1" fill="url(#gPresent)" strokeWidth={2} name="Present" />
                <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#gAbsent)" strokeWidth={2} name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="erp-card p-6">
          <h3 className="font-semibold text-foreground mb-1">Grade Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Students by grade category</p>
          {loading ? <div className="h-56 bg-muted animate-pulse rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
  <Pie
    data={stats?.gradeDistribution ?? []}
    dataKey="count"
    nameKey="grade"
    cx="50%"
    cy="50%"
    innerRadius={50}
    outerRadius={80}
    paddingAngle={3}
  >
    {(stats?.gradeDistribution ?? []).map(
      (_: unknown, i: number) => (
        <Cell
          key={i}
          fill={PIE_COLORS[i % PIE_COLORS.length]}
        />
      )
    )}
  </Pie>

  <Tooltip
    contentStyle={{
      background: "hsl(var(--popover))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 12,
      fontSize: 12,
    }}
  />

  <Legend
    iconSize={10}
    iconType="circle"
    wrapperStyle={{ fontSize: 12 }}
  />
</PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <AnnouncementsPanel items={announcements} />
    </div>
  );
}

/* ─── Teacher Dashboard ─────────────────────────────────────────────────────── */

function TeacherDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authService.me(),
      dashboardService.getAnnouncements(),
    ]).then(([me, a]) => {
      setProfile(me as unknown as Record<string, unknown>);
      setAnnouncements(a);
    }).finally(() => setLoading(false));
  }, []);

  const raw = profile as { teacher?: { subjects?: { subject?: { name: string } }[]; classes?: { name: string; section: string; grade: number; _count?: { students: number } }[] } } | null;
  const teacher = raw?.teacher;
  const subjects = teacher?.subjects ?? [];
  const classes = teacher?.classes ?? [];
  const totalStudents = classes.reduce((acc, c) => acc + (c._count?.students ?? 0), 0);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="My Classes" value={classes.length} sub="This semester" icon={<School className="w-5 h-5" />} color="bg-gradient-to-br from-indigo-500 to-indigo-700" />
          <StatCard title="My Subjects" value={subjects.length} sub="Teaching" icon={<BookOpen className="w-5 h-5" />} color="bg-gradient-to-br from-cyan-500 to-cyan-700" />
          <StatCard title="My Students" value={totalStudents} sub="Across all classes" icon={<Users className="w-5 h-5" />} color="bg-gradient-to-br from-emerald-500 to-emerald-700" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="erp-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <School className="w-4 h-4 text-indigo-500" />
            <h3 className="font-semibold text-foreground">My Classes</h3>
          </div>
          {loading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}</div>
            : classes.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">No classes assigned</p>
            : (
              <div className="space-y-2">
                {classes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">{c.grade}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Section {c.section}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{c._count?.students ?? 0} students</span>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="erp-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-cyan-500" />
            <h3 className="font-semibold text-foreground">My Subjects</h3>
          </div>
          {loading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}</div>
            : subjects.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">No subjects assigned</p>
            : (
              <div className="space-y-2">
                {subjects.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-700 dark:text-cyan-300">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{s.subject?.name ?? "—"}</p>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <AnnouncementsPanel items={announcements} />
    </div>
  );
}

/* ─── Student Dashboard ─────────────────────────────────────────────────────── */

function StudentDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<{ present: number; absent: number; late: number }>({ present: 0, absent: 0, late: 0 });
  const [grades, setGrades] = useState<{ subject?: { name: string }; marks: number; maxMarks: number; examType: string; grade?: string }[]>([]);
  const [studentInfo, setStudentInfo] = useState<{ class?: { name: string }; rollNumber?: string; studentId?: string } | null>(null);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authService.me(),
      dashboardService.getAnnouncements(),
    ]).then(async ([me, a]) => {
      setAnnouncements(a);
      const raw = me as unknown as { studentId?: string; student?: { id: string; class?: { name: string }; rollNumber?: string; studentId?: string } };
      const studentId = raw.student?.id ?? raw.studentId;
      if (studentId) {
        setStudentInfo(raw.student ?? null);
        const [att, gr] = await Promise.all([
          studentService.getAttendance(studentId),
          studentService.getGrades(studentId),
        ]);
        const attArr = Array.isArray(att) ? att : (att as { data?: unknown[] }).data ?? [];
        const grArr  = Array.isArray(gr)  ? gr  : (gr  as { data?: unknown[] }).data ?? [];
        const present = attArr.filter((r: unknown) => (r as { status: string }).status === "PRESENT").length;
        const absent  = attArr.filter((r: unknown) => (r as { status: string }).status === "ABSENT").length;
        const late    = attArr.filter((r: unknown) => (r as { status: string }).status === "LATE").length;
        setAttendance({ present, absent, late });
        setGrades(grArr as typeof grades);
      }
    }).finally(() => setLoading(false));
  }, []);

  const total = attendance.present + attendance.absent + attendance.late;
  const pct = total > 0 ? Math.round((attendance.present / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Attendance %" value={`${pct}%`} sub={`${total} sessions`} icon={<ClipboardCheck className="w-5 h-5" />} color="bg-gradient-to-br from-indigo-500 to-indigo-700" />
          <StatCard title="Present" value={attendance.present} sub="Sessions" icon={<TrendingUp className="w-5 h-5" />} color="bg-gradient-to-br from-emerald-500 to-emerald-700" />
          <StatCard title="Absent" value={attendance.absent} sub="Sessions" icon={<AlertCircle className="w-5 h-5" />} color="bg-gradient-to-br from-red-500 to-red-700" />
          <StatCard title="My Class" value={studentInfo?.class?.name ?? "—"} sub={studentInfo?.studentId ?? ""} icon={<GraduationCap className="w-5 h-5" />} color="bg-gradient-to-br from-amber-500 to-amber-700" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance bar */}
        <div className="erp-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Attendance Summary</h3>
          {loading ? <div className="h-40 bg-muted animate-pulse rounded-xl" /> : (
            <div className="space-y-4">
              {[
                { label: "Present", count: attendance.present, color: "bg-emerald-500" },
                { label: "Absent",  count: attendance.absent,  color: "bg-red-500" },
                { label: "Late",    count: attendance.late,    color: "bg-amber-500" },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: total > 0 ? `${Math.round((count / total) * 100)}%` : "0%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent grades */}
        <div className="erp-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h3 className="font-semibold text-foreground">Recent Grades</h3>
          </div>
          {loading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}</div>
            : grades.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">No grades yet</p>
            : (
              <div className="space-y-2">
                {grades.slice(0, 6).map((g, i) => {
                  const pct = calcPercentage(g.marks, g.maxMarks);
                  const gradeLabel = g.grade ?? (pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "F");
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{g.subject?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{g.examType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{g.marks}/{g.maxMarks}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct >= 60 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>{gradeLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      <AnnouncementsPanel items={announcements} />
    </div>
  );
}

/* ─── Main Dashboard Page ───────────────────────────────────────────────────── */

import { BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? "STUDENT";

  return (
    <div className="space-y-6">
      <WelcomeBanner name={user?.name ?? "User"} role={role} />
      {role === "ADMIN"   && <AdminDashboard />}
      {role === "TEACHER" && <TeacherDashboard />}
      {role === "STUDENT" && <StudentDashboard />}
    </div>
  );
}
