const express = require("express");
const { body } = require("express-validator");
const {
  getStudents, getStudentById, createStudent, updateStudent,
  deleteStudent, getStudentAttendance, getStudentGrades,
} = require("../controllers/student.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { upload } = require("../config/multer");

const router = express.Router();

router.use(authenticate);

router.get("/", getStudents);
router.get("/:id", getStudentById);
router.get("/:id/attendance", getStudentAttendance);
router.get("/:id/grades", getStudentGrades);

router.post(
  "/",
  authorize("ADMIN"),
  upload.single("profileImage"),
  [
    body("firstName").notEmpty().withMessage("First name required"),
    body("lastName").notEmpty().withMessage("Last name required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("gender").isIn(["MALE", "FEMALE", "OTHER"]).withMessage("Valid gender required"),
  ],
  validate,
  createStudent
);

router.put(
  "/:id",
  authorize("ADMIN"),
  upload.single("profileImage"),
  [
    body("firstName").optional().notEmpty(),
    body("gender").optional().isIn(["MALE", "FEMALE", "OTHER"]),
  ],
  validate,
  updateStudent
);

router.delete("/:id", authorize("ADMIN"), deleteStudent);

module.exports = router;
