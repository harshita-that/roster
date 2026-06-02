const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { generateToken } = require("../utils/jwt");

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      teacher: { select: { firstName: true, lastName: true, profileImage: true } },
      student: { select: { firstName: true, lastName: true, profileImage: true } },
    },
  });

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: "Account has been deactivated" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const token = generateToken(user.id, user.role);

  const profile = user.teacher || user.student;

  res.json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: profile?.firstName || null,
        lastName: profile?.lastName || null,
        profileImage: profile?.profileImage || null,
      },
    },
  });
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      teacher: true,
      student: { include: { class: true } },
    },
  });

  const { password: _, ...safeUser } = user;

  res.json({ success: true, data: safeUser });
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Current password is incorrect" });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

  res.json({ success: true, message: "Password changed successfully" });
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = (req, res) => {
  // JWT is stateless; client drops the token
  res.json({ success: true, message: "Logged out successfully" });
};

module.exports = { login, getMe, changePassword, logout };
