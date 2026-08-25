const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect);

// Encode a multer memory-storage file into a base64 data URI, e.g.
// "data:image/png;base64,iVBORw0KG...". This string is what gets stored
// directly in MongoDB (e.g. SparePart.photo) - no disk/file involved.
const toDataUri = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

// Single file: field name "file"
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }
  res.status(201).json({
    success: true,
    data: {
      originalName: req.file.originalname,
      data: toDataUri(req.file),
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
});

// Multiple files: field name "files"
router.post("/multiple", upload.array("files", 10), (req, res) => {
  const files = (req.files || []).map((f) => ({
    originalName: f.originalname,
    data: toDataUri(f),
    mimetype: f.mimetype,
    size: f.size,
  }));
  res.status(201).json({ success: true, data: files });
});

module.exports = router;
