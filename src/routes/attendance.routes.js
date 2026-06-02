const express = require("express");
const { body } = require("express-validator");
const {
  getAttendance, markAttendance, getAttendanceSummary, updateAttendance,
} = require("../controllers/attendance.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(authenticate);

router.get("/", getAttendance);
router.get("/summary", getAttendanceSummary);

router.post(
  "/",
  authorize("ADMIN", "TEACHER"),
  [
    body("classId").notEmpty().withMessage("classId required"),
    body("date").isISO8601().withMessage("Valid date required"),
    body("records").isArray({ min: 1 }).withMessage("records array required"),
  ],
  validate,
  markAttendance
);

router.put("/:id", authorize("ADMIN", "TEACHER"), updateAttendance);

module.exports = router;
