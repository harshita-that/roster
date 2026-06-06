import api from "@/lib/axios";

export const dashboardService = {
  getStats: async () => {
    const { data } = await api.get("/api/dashboard/stats");
    const raw = data.data;
    const counts = raw.counts ?? {};

    // Compute attendance % from today's summary
    const today = (raw.attendanceToday ?? []) as { status: string; _count: { status: number } }[];
    const present = today.find((a) => a.status === "PRESENT")?._count?.status ?? 0;
    const absent  = today.find((a) => a.status === "ABSENT")?._count?.status ?? 0;
    const late    = today.find((a) => a.status === "LATE")?._count?.status ?? 0;
    const total   = present + absent + late;
    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    // Grade distribution
    const gradeDistribution = (raw.gradeDistribution ?? []).map(
      (g: { grade: string | null; _count: { grade: number } }) => ({
        grade: g.grade ?? "N/A",
        count: g._count?.grade ?? 0,
      })
    );

    // Monthly attendance (comes as raw SQL result — values are BigInt strings)
    const monthlyAttendance = (raw.monthlyAttendance ?? []).map(
      (r: { month: string; present: unknown; absent: unknown; total: unknown }) => ({
        date: r.month,
        present: Number(r.present ?? 0),
        absent:  Number(r.absent ?? 0),
        late: 0,
      })
    );

    return {
      totalStudents:  counts.totalStudents  ?? 0,
      totalTeachers:  counts.totalTeachers  ?? 0,
      totalClasses:   counts.totalClasses   ?? 0,
      totalSubjects:  counts.totalSubjects  ?? 0,
      attendancePercentage,
      gradeDistribution,
      attendanceTrend: monthlyAttendance,
      recentStudents: raw.recentStudents ?? [],
    };
  },

  getAttendanceChart: async () => {
    const { data } = await api.get("/api/dashboard/attendance-chart");
    const raw: { day: string; present: unknown; absent: unknown; late: unknown }[] = data.data ?? [];
    return raw.map((r) => ({
      date: new Date(r.day).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      present: Number(r.present ?? 0),
      absent:  Number(r.absent  ?? 0),
      late:    Number(r.late    ?? 0),
    }));
  },

  getAnnouncements: async () => {
    const { data } = await api.get("/api/dashboard/announcements");
    return (data.data ?? []) as { id: string; title: string; content: string; createdAt: string }[];
  },

  createAnnouncement: async (payload: { title: string; content: string }) => {
    const { data } = await api.post("/api/dashboard/announcements", payload);
    return data.data ?? data;
  },

  deleteAnnouncement: async (id: string) => {
    await api.delete(`/api/dashboard/announcements/${id}`);
  },
};
