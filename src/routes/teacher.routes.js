const express = require("express");
const { body } = require("express-validator");
const {
  getTeachers, getTeacherById, createTeacher, updateTeacher,
  deleteTeacher, assignSubjects,
} = require("../controllers/teacher.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { upload } = require("../config/multer");

const router = express.Router();

router.use(authenticate);

router.get("/", getTeachers);
router.get("/:id", getTeacherById);

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
  createTeacher
);

router.put(
  "/:id",
  authorize("ADMIN"),
  upload.single("profileImage"),
  validate,
  updateTeacher
);

router.delete("/:id", authorize("ADMIN"), deleteTeacher);

router.post(
  "/:id/subjects",
  authorize("ADMIN"),
  [body("subjectIds").isArray().withMessage("subjectIds must be an array")],
  validate,
  assignSubjects
);

module.exports = router;
