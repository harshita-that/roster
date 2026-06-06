// subject.routes.js
const express = require("express");
const { body } = require("express-validator");
const {
  getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject,
} = require("../controllers/subject.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(authenticate);

router.get("/", getSubjects);
router.get("/:id", getSubjectById);
router.post(
  "/",
  authorize("ADMIN"),
  [body("name").notEmpty(), body("code").notEmpty()],
  validate,
  createSubject
);
router.put("/:id", authorize("ADMIN"), validate, updateSubject);
router.delete("/:id", authorize("ADMIN"), deleteSubject);

module.exports = router;
