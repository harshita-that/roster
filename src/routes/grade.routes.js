const express = require("express");
const { body } = require("express-validator");
const {
  getGrades, createGrade, updateGrade, deleteGrade, getGradeReport,
} = require("../controllers/grade.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(authenticate);

router.get("/", getGrades);
router.get("/report", getGradeReport);

router.post(
  "/",
  authorize("ADMIN", "TEACHER"),
  [
    body("studentId").notEmpty(),
    body("subjectId").notEmpty(),
    body("examType").isIn(["MIDTERM", "FINAL", "QUIZ", "ASSIGNMENT", "PROJECT"]),
    body("marks").isFloat({ min: 0 }),
    body("maxMarks").isFloat({ min: 1 }),
    body("examDate").isISO8601(),
  ],
  validate,
  createGrade
);

router.put("/:id", authorize("ADMIN", "TEACHER"), validate, updateGrade);
router.delete("/:id", authorize("ADMIN"), deleteGrade);

module.exports = router;
