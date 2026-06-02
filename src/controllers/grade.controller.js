const prisma = require("../config/db");
const { paginate, paginateMeta } = require("../utils/paginate");

// Calculate letter grade
const getLetterGrade = (marks, maxMarks) => {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

// ─── GET /api/grades ──────────────────────────────────────────────────────────
const getGrades = async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query);
  const { studentId, subjectId, examType } = req.query;

  const where = {
    ...(studentId && { studentId }),
    ...(subjectId && { subjectId }),
    ...(examType && { examType }),
  };

  const [grades, total] = await Promise.all([
    prisma.grade.findMany({
      where, skip, take,
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        subject: { select: { name: true, code: true } },
      },
      orderBy: { examDate: "desc" },
    }),
    prisma.grade.count({ where }),
  ]);

  res.json({ success: true, data: grades, meta: paginateMeta(total, page, limit) });
};

// ─── POST /api/grades ─────────────────────────────────────────────────────────
const createGrade = async (req, res) => {
  const { studentId, subjectId, examType, marks, maxMarks, remarks, examDate } = req.body;

  const grade = await prisma.grade.create({
    data: {
      studentId, subjectId, examType,
      marks: parseFloat(marks),
      maxMarks: parseFloat(maxMarks),
      grade: getLetterGrade(parseFloat(marks), parseFloat(maxMarks)),
      remarks,
      examDate: new Date(examDate),
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      subject: { select: { name: true, code: true } },
    },
  });

  res.status(201).json({ success: true, message: "Grade recorded", data: grade });
};

// ─── PUT /api/grades/:id ──────────────────────────────────────────────────────
const updateGrade = async (req, res) => {
  const { marks, maxMarks, remarks, examDate } = req.body;

  const existing = await prisma.grade.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Grade not found" });

  const m = marks ? parseFloat(marks) : existing.marks;
  const mm = maxMarks ? parseFloat(maxMarks) : existing.maxMarks;

  const grade = await prisma.grade.update({
    where: { id: req.params.id },
    data: {
      marks: m, maxMarks: mm,
      grade: getLetterGrade(m, mm),
      remarks,
      examDate: examDate ? new Date(examDate) : undefined,
    },
  });

  res.json({ success: true, message: "Grade updated", data: grade });
};

// ─── DELETE /api/grades/:id ───────────────────────────────────────────────────
const deleteGrade = async (req, res) => {
  await prisma.grade.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Grade deleted" });
};

// ─── GET /api/grades/report ───────────────────────────────────────────────────
const getGradeReport = async (req, res) => {
  const { studentId, subjectId } = req.query;

  if (!studentId) return res.status(400).json({ success: false, message: "studentId required" });

  const grades = await prisma.grade.findMany({
    where: { studentId, ...(subjectId && { subjectId }) },
    include: { subject: true },
    orderBy: { examDate: "desc" },
  });

  const bySubject = grades.reduce((acc, g) => {
    const key = g.subject.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  res.json({ success: true, data: { grades, bySubject } });
};

module.exports = { getGrades, createGrade, updateGrade, deleteGrade, getGradeReport };
