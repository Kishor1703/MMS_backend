const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|xlsx|xls|csv|doc|docx/;

const fileFilter = (req, file, cb) => {
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (ext) return cb(null, true);
  cb(new Error("Unsupported file type"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

module.exports = upload;
