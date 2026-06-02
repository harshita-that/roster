const express = require("express");
const { body } = require("express-validator");
const {
  getClasses, getClassById, createClass, updateClass, deleteClass, assignSubjects,
} = require("../controllers/class.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(authenticate);

router.get("/", getClasses);
router.get("/:id", getClassById);

router.post(
  "/",
  authorize("ADMIN"),
  [
    body("name").notEmpty().withMessage("Class name required"),
    body("section").notEmpty().withMessage("Section required"),
    body("grade").notEmpty().withMessage("Grade required"),
    body("academicYear").notEmpty().withMessage("Academic year required"),
  ],
  validate,
  createClass
);

router.put("/:id", authorize("ADMIN"), validate, updateClass);
router.delete("/:id", authorize("ADMIN"), deleteClass);

router.post(
  "/:id/subjects",
  authorize("ADMIN"),
  [body("subjectIds").isArray()],
  validate,
  assignSubjects
);

module.exports = router;
