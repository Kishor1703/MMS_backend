const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

// Single file: field name "file"
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }
  res.status(201).json({
    success: true,
    data: {
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
});

// Multiple files: field name "files"
router.post("/multiple", upload.array("files", 10), (req, res) => {
  const files = (req.files || []).map((f) => ({
    filename: f.filename,
    url: `/uploads/${f.filename}`,
    mimetype: f.mimetype,
    size: f.size,
  }));
  res.status(201).json({ success: true, data: files });
});

module.exports = router;
