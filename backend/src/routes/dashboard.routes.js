const express = require("express");
const { body } = require("express-validator");
const {
  getDashboardStats, getAttendanceChart, getAnnouncements,
  createAnnouncement, deleteAnnouncement,
} = require("../controllers/dashboard.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(authenticate);

router.get("/stats", authorize("ADMIN"), getDashboardStats);
router.get("/attendance-chart", authenticate, getAttendanceChart);
router.get("/announcements", getAnnouncements);

router.post(
  "/announcements",
  authorize("ADMIN"),
  [body("title").notEmpty(), body("content").notEmpty()],
  validate,
  createAnnouncement
);

router.delete("/announcements/:id", authorize("ADMIN"), deleteAnnouncement);

module.exports = router;
