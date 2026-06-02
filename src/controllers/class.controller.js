const prisma = require("../config/db");
const { paginate, paginateMeta } = require("../utils/paginate");

// ─── GET /api/classes ─────────────────────────────────────────────────────────
const getClasses = async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query);
  const { search, grade, academicYear } = req.query;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { section: { contains: search, mode: "insensitive" } },
        { room: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(grade && { grade }),
    ...(academicYear && { academicYear }),
  };

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where, skip, take,
      include: {
        teacher: { select: { firstName: true, lastName: true, employeeId: true } },
        _count: { select: { students: true, subjects: true } },
      },
      orderBy: [{ grade: "asc" }, { name: "asc" }, { section: "asc" }],
    }),
    prisma.class.count({ where }),
  ]);

  res.json({ success: true, data: classes, meta: paginateMeta(total, page, limit) });
};

// ─── GET /api/classes/:id ─────────────────────────────────────────────────────
const getClassById = async (req, res) => {
  const cls = await prisma.class.findUnique({
    where: { id: req.params.id },
    include: {
      teacher: true,
      students: { orderBy: { firstName: "asc" } },
      subjects: { include: { subject: true } },
    },
  });

  if (!cls) return res.status(404).json({ success: false, message: "Class not found" });
  res.json({ success: true, data: cls });
};

// ─── POST /api/classes ────────────────────────────────────────────────────────
const createClass = async (req, res) => {
  const { name, section, grade, teacherId, capacity, room, academicYear } = req.body;

  const cls = await prisma.class.create({
    data: {
      name, section, grade, capacity: parseInt(capacity) || 30,
      room, academicYear, teacherId: teacherId || null,
    },
    include: { teacher: { select: { firstName: true, lastName: true } } },
  });

  res.status(201).json({ success: true, message: "Class created successfully", data: cls });
};

// ─── PUT /api/classes/:id ─────────────────────────────────────────────────────
const updateClass = async (req, res) => {
  const { name, section, grade, teacherId, capacity, room, academicYear } = req.body;

  const existing = await prisma.class.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Class not found" });

  const cls = await prisma.class.update({
    where: { id: req.params.id },
    data: {
      name, section, grade, room, academicYear,
      capacity: capacity ? parseInt(capacity) : undefined,
      teacherId: teacherId || null,
    },
  });

  res.json({ success: true, message: "Class updated successfully", data: cls });
};

// ─── DELETE /api/classes/:id ──────────────────────────────────────────────────
const deleteClass = async (req, res) => {
  const existing = await prisma.class.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Class not found" });

  await prisma.class.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Class deleted successfully" });
};

// ─── POST /api/classes/:id/subjects ───────────────────────────────────────────
const assignSubjects = async (req, res) => {
  const { subjectIds } = req.body;

  await prisma.classSubject.deleteMany({ where: { classId: req.params.id } });

  if (subjectIds && subjectIds.length > 0) {
    await prisma.classSubject.createMany({
      data: subjectIds.map((subjectId) => ({ classId: req.params.id, subjectId })),
    });
  }

  res.json({ success: true, message: "Subjects assigned to class" });
};

module.exports = { getClasses, getClassById, createClass, updateClass, deleteClass, assignSubjects };
