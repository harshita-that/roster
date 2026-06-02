const path = require("path");
const fs = require("fs");
const prisma = require("../config/db");
const { paginate, paginateMeta } = require("../utils/paginate");
const { UPLOAD_DIR } = require("../config/multer");

// ─── POST /api/files/upload ───────────────────────────────────────────────────
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const file = await prisma.file.create({
    data: {
      userId: req.user.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      description: req.body.description || null,
    },
  });

  res.status(201).json({ success: true, message: "File uploaded successfully", data: file });
};

// ─── GET /api/files ───────────────────────────────────────────────────────────
const getFiles = async (req, res) => {
  const { skip, take, page, limit } = paginate(req.query);
  const { search } = req.query;

  // Admins see all files; others see only their own
  const where = {
    ...(req.user.role !== "ADMIN" && { userId: req.user.id }),
    ...(search && {
      OR: [
        { originalName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where, skip, take,
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.file.count({ where }),
  ]);

  res.json({ success: true, data: files, meta: paginateMeta(total, page, limit) });
};

// ─── DELETE /api/files/:id ────────────────────────────────────────────────────
const deleteFile = async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ success: false, message: "File not found" });

  // Only admin or owner can delete
  if (req.user.role !== "ADMIN" && file.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  // Delete from disk
  const filePath = path.join(UPLOAD_DIR, file.storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.file.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "File deleted" });
};

// ─── GET /api/files/:id/download ─────────────────────────────────────────────
const downloadFile = async (req, res) => {
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ success: false, message: "File not found" });

  const filePath = path.join(UPLOAD_DIR, file.storedName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found on disk" });
  }

  res.download(filePath, file.originalName);
};

module.exports = { uploadFile, getFiles, deleteFile, downloadFile };
