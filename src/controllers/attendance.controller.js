const prisma = require("../config/db");
const { paginate, paginateMeta } = require("../utils/paginate");

// ─── GET /api/attendance ──────────────────────────────────────────────────────
const getAttendance = async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query);
  const { classId, date, status, studentId } = req.query;

  const where = {
    ...(classId && { classId }),
    ...(status && { status }),
    ...(studentId && { studentId }),
    ...(date && { date: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } }),
  };

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where, skip, take,
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        class: { select: { name: true, section: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.attendance.count({ where }),
  ]);

  res.json({ success: true, data: attendance, meta: paginateMeta(total, page, limit) });
};

// ─── POST /api/attendance ─────────────────────────────────────────────────────
// Mark attendance for multiple students at once
const markAttendance = async (req, res) => {
  const { classId, date, records } = req.body;
  // records: [{ studentId, status, remarks }]

 const parsedDate = new Date(date);

  let teacherId = null;
  if (req.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    teacherId = teacher?.id || null;
  }

  const upserts = records.map((r) =>
    prisma.attendance.upsert({
      where: { studentId_classId_date: { studentId: r.studentId, classId, date: parsedDate } },
      create: {
        studentId: r.studentId,
        classId,
        date: parsedDate,
        status: r.status,
        remarks: r.remarks || null,
        teacherId,
      },
      update: { status: r.status, remarks: r.remarks || null },
    })
  );

  await Promise.all(upserts);

  res.json({ success: true, message: `Attendance marked for ${records.length} students` });
};

// ─── GET /api/attendance/summary ──────────────────────────────────────────────
const getAttendanceSummary = async (req, res) => {
  const { classId, month, year } = req.query;

  const startDate = new Date(`${year || new Date().getFullYear()}-${(month || new Date().getMonth() + 1).toString().padStart(2, "0")}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const where = {
    date: { gte: startDate, lt: endDate },
    ...(classId && { classId }),
  };

  const summary = await prisma.attendance.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  });

  res.json({ success: true, data: summary });
};

// ─── PUT /api/attendance/:id ──────────────────────────────────────────────────
const updateAttendance = async (req, res) => {
  const { status, remarks } = req.body;

  const attendance = await prisma.attendance.update({
    where: { id: req.params.id },
    data: { status, remarks },
  });

  res.json({ success: true, message: "Attendance updated", data: attendance });
};

module.exports = { getAttendance, markAttendance, getAttendanceSummary, updateAttendance };
