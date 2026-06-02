const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { paginate, paginateMeta } = require("../utils/paginate");

// ─── GET /api/teachers ────────────────────────────────────────────────────────
const getTeachers = async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query);
  const { search, gender } = req.query;

  const where = {
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(gender && { gender }),
  };

  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where, skip, take,
      include: {
        subjects: { include: { subject: true } },
        classes: { select: { name: true, section: true, grade: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.count({ where }),
  ]);

  res.json({ success: true, data: teachers, meta: paginateMeta(total, page, limit) });
};

// ─── GET /api/teachers/:id ────────────────────────────────────────────────────
const getTeacherById = async (req, res) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: req.params.id },
    include: {
      subjects: { include: { subject: true } },
      classes: { include: { students: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });

  if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });
  res.json({ success: true, data: teacher });
};

// ─── POST /api/teachers ───────────────────────────────────────────────────────
const createTeacher = async (req, res) => {
  const {
    firstName, lastName, email, phone, gender, dateOfBirth,
    address, qualification, salary, password, employeeId,
  } = req.body;

  const hashed = await bcrypt.hash(password || "Teacher@123", 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: email.toLowerCase(), password: hashed, role: "TEACHER" },
    });

    const teacher = await tx.teacher.create({
      data: {
        userId: user.id,
        employeeId: employeeId || `EMP${Date.now()}`,
        firstName, lastName, email: email.toLowerCase(),
        phone, gender, address, qualification,
        salary: salary ? parseFloat(salary) : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        profileImage: req.file ? `/uploads/${req.file.filename}` : null,
      },
    });

    return teacher;
  });

  res.status(201).json({ success: true, message: "Teacher created successfully", data: result });
};

// ─── PUT /api/teachers/:id ────────────────────────────────────────────────────
const updateTeacher = async (req, res) => {
  const {
    firstName, lastName, phone, gender, dateOfBirth,
    address, qualification, salary,
  } = req.body;

  const existing = await prisma.teacher.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Teacher not found" });

  const teacher = await prisma.teacher.update({
    where: { id: req.params.id },
    data: {
      firstName, lastName, phone, gender, address, qualification,
      salary: salary ? parseFloat(salary) : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      ...(req.file && { profileImage: `/uploads/${req.file.filename}` }),
    },
  });

  res.json({ success: true, message: "Teacher updated successfully", data: teacher });
};

// ─── DELETE /api/teachers/:id ─────────────────────────────────────────────────
const deleteTeacher = async (req, res) => {
  const existing = await prisma.teacher.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Teacher not found" });

  await prisma.user.delete({ where: { id: existing.userId } });
  res.json({ success: true, message: "Teacher deleted successfully" });
};

// ─── POST /api/teachers/:id/subjects ──────────────────────────────────────────
const assignSubjects = async (req, res) => {
  const { subjectIds } = req.body;

  // Delete existing then re-assign
  await prisma.teacherSubject.deleteMany({ where: { teacherId: req.params.id } });

  if (subjectIds && subjectIds.length > 0) {
    await prisma.teacherSubject.createMany({
      data: subjectIds.map((subjectId) => ({ teacherId: req.params.id, subjectId })),
    });
  }

  res.json({ success: true, message: "Subjects assigned successfully" });
};

module.exports = {
  getTeachers, getTeacherById, createTeacher,
  updateTeacher, deleteTeacher, assignSubjects,
};
