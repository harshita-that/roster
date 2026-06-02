const prisma = require("../config/db");
const { paginate, paginateMeta } = require("../utils/paginate");

const getSubjects = async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query);
  const { search } = req.query;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({
      where, skip, take,
      include: { _count: { select: { teachers: true, classes: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.subject.count({ where }),
  ]);

  res.json({ success: true, data: subjects, meta: paginateMeta(total, page, limit) });
};

const getSubjectById = async (req, res) => {
  const subject = await prisma.subject.findUnique({
    where: { id: req.params.id },
    include: {
      teachers: { include: { teacher: { select: { firstName: true, lastName: true, employeeId: true } } } },
      classes: { include: { class: { select: { name: true, section: true, grade: true } } } },
    },
  });

  if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
  res.json({ success: true, data: subject });
};

const createSubject = async (req, res) => {
  const { name, code, description, credits } = req.body;

  const subject = await prisma.subject.create({
    data: { name, code: code.toUpperCase(), description, credits: parseInt(credits) || 1 },
  });

  res.status(201).json({ success: true, message: "Subject created successfully", data: subject });
};

const updateSubject = async (req, res) => {
  const { name, code, description, credits } = req.body;

  const existing = await prisma.subject.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Subject not found" });

  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: {
      name,
      code: code ? code.toUpperCase() : undefined,
      description,
      credits: credits ? parseInt(credits) : undefined,
    },
  });

  res.json({ success: true, message: "Subject updated successfully", data: subject });
};

const deleteSubject = async (req, res) => {
  const existing = await prisma.subject.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Subject not found" });

  await prisma.subject.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Subject deleted successfully" });
};

module.exports = { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
