const prisma = require("../config/db");

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    recentStudents,
    attendanceToday,
    gradeDistribution,
    monthlyAttendance,
    announcements,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.subject.count(),

    // Recent students
    prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { class: { select: { name: true, section: true } } },
    }),

    // Today's attendance summary
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      _count: { status: true },
    }),

    // Grade distribution
    prisma.grade.groupBy({
      by: ["grade"],
      _count: { grade: true },
      orderBy: { grade: "asc" },
    }),

    // Monthly attendance for last 6 months
    prisma.$queryRaw`
      SELECT
        TO_CHAR(date, 'Mon YYYY') as month,
        COUNT(*) FILTER (WHERE status = 'PRESENT') as present,
        COUNT(*) FILTER (WHERE status = 'ABSENT') as absent,
        COUNT(*) as total
      FROM attendance
      WHERE date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(date, 'Mon YYYY'), DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date) ASC
    `,

    // Recent announcements
    prisma.announcement.findMany({
      where: { isActive: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Cast BigInt values from raw SQL to plain Numbers
  const safeMonthly = monthlyAttendance.map((r) => ({
    month:   r.month,
    present: Number(r.present ?? 0),
    absent:  Number(r.absent  ?? 0),
    total:   Number(r.total   ?? 0),
  }));

  res.json({
    success: true,
    data: {
      counts: { totalStudents, totalTeachers, totalClasses, totalSubjects },
      recentStudents,
      attendanceToday,
      gradeDistribution,
      monthlyAttendance: safeMonthly,
      announcements,
    },
  });
};

// ─── GET /api/dashboard/attendance-chart ──────────────────────────────────────
const getAttendanceChart = async (req, res) => {
  const { classId } = req.query;

  const raw = await prisma.$queryRaw`
    SELECT
      DATE(date) as day,
      COUNT(*) FILTER (WHERE status = 'PRESENT') as present,
      COUNT(*) FILTER (WHERE status = 'ABSENT') as absent,
      COUNT(*) FILTER (WHERE status = 'LATE') as late,
      COUNT(*) as total
    FROM attendance
    WHERE date >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(date)
    ORDER BY day ASC
  `;

  const data = raw.map((r) => ({
    day:     r.day,
    present: Number(r.present ?? 0),
    absent:  Number(r.absent  ?? 0),
    late:    Number(r.late    ?? 0),
    total:   Number(r.total   ?? 0),
  }));

  res.json({ success: true, data });
};

// ─── GET /api/dashboard/announcements ────────────────────────────────────────
const getAnnouncements = async (req, res) => {
  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ targetRole: null }, { targetRole: req.user.role }],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  res.json({ success: true, data: announcements });
};

// ─── POST /api/dashboard/announcements ───────────────────────────────────────
const createAnnouncement = async (req, res) => {
  const { title, content, targetRole } = req.body;

  const ann = await prisma.announcement.create({
    data: { title, content, targetRole: targetRole || null },
  });

  res.status(201).json({ success: true, message: "Announcement created", data: ann });
};

// ─── DELETE /api/dashboard/announcements/:id ──────────────────────────────────
const deleteAnnouncement = async (req, res) => {
  await prisma.announcement.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ success: true, message: "Announcement removed" });
};

module.exports = {
  getDashboardStats,
  getAttendanceChart,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};
