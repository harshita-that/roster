const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { paginate, paginateMeta } = require("../utils/paginate");

// ─── GET /api/students ────────────────────────────────────────────────────────
const getStudents = async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query);
  const { search, classId, gender } = req.query;

  const where = {
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(classId && { classId }),
    ...(gender && { gender }),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take,
      include: { class: { select: { name: true, section: true, grade: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where }),
  ]);

  res.json({
    success: true,
    data: students,
    meta: paginateMeta(total, page, limit),
  });
};

// ─── GET /api/students/:id ────────────────────────────────────────────────────
const getStudentById = async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      class: true,
      attendance: { orderBy: { date: "desc" }, take: 10 },
      grades: { include: { subject: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!student) return res.status(404).json({ success: false, message: "Student not found" });

  res.json({ success: true, data: student });
};

// ─── POST /api/students ───────────────────────────────────────────────────────
const createStudent = async (req, res) => {
  const {
    firstName, lastName, email, phone, gender, dateOfBirth,
    address, parentName, parentPhone, classId, password, studentId,
  } = req.body;

  const hashed = await bcrypt.hash(password || "Student@123", 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: email.toLowerCase(), password: hashed, role: "STUDENT" },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        studentId: studentId || `STU${Date.now()}`,
        firstName, lastName, email: email.toLowerCase(),
        phone, gender, address, parentName, parentPhone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        classId: classId || null,
        profileImage: req.file ? `/uploads/${req.file.filename}` : null,
      },
      include: { class: true },
    });

    return student;
  });

  res.status(201).json({ success: true, message: "Student created successfully", data: result });
};

// ─── PUT /api/students/:id ────────────────────────────────────────────────────
const updateStudent = async (req, res) => {
  const {
    firstName, lastName, phone, gender, dateOfBirth,
    address, parentName, parentPhone, classId,
  } = req.body;

  const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Student not found" });

  const student = await prisma.student.update({
    where: { id: req.params.id },
    data: {
      firstName, lastName, phone, gender, address, parentName, parentPhone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      classId: classId || null,
      ...(req.file && { profileImage: `/uploads/${req.file.filename}` }),
    },
    include: { class: true },
  });

  res.json({ success: true, message: "Student updated successfully", data: student });
};

// ─── DELETE /api/students/:id ─────────────────────────────────────────────────
const deleteStudent = async (req, res) => {
  const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Student not found" });

  // Cascade deletes user which cascades to student
  await prisma.user.delete({ where: { id: existing.userId } });

  res.json({ success: true, message: "Student deleted successfully" });
};

// ─── GET /api/students/:id/attendance ─────────────────────────────────────────
const getStudentAttendance = async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query);

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { studentId: req.params.id },
      include: { class: { select: { name: true, section: true } } },
      skip, take, orderBy: { date: "desc" },
    }),
    prisma.attendance.count({ where: { studentId: req.params.id } }),
  ]);

  const summary = await prisma.attendance.groupBy({
    by: ["status"],
    where: { studentId: req.params.id },
    _count: { status: true },
  });

  res.json({
    success: true,
    data: attendance,
    summary,
    meta: paginateMeta(total, page, limit),
  });
};

// ─── GET /api/students/:id/grades ─────────────────────────────────────────────
const getStudentGrades = async (req, res) => {
  const grades = await prisma.grade.findMany({
    where: { studentId: req.params.id },
    include: { subject: true },
    orderBy: { examDate: "desc" },
  });

  res.json({ success: true, data: grades });
};

module.exports = {
  getStudents, getStudentById, createStudent,
  updateStudent, deleteStudent, getStudentAttendance, getStudentGrades,
};
