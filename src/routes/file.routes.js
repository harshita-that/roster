const express = require("express");
const { uploadFile, getFiles, deleteFile, downloadFile } = require("../controllers/file.controller");
const { authenticate } = require("../middleware/auth");
const { upload } = require("../config/multer");

const router = express.Router();
router.use(authenticate);

router.get("/", getFiles);
router.post("/upload", upload.single("file"), uploadFile);
router.get("/:id/download", downloadFile);
router.delete("/:id", deleteFile);

module.exports = router;
