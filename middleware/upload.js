const multer = require("multer");
const path = require("path");

// Store the file in memory (req.file.buffer) instead of writing it to disk.
// Vercel serverless functions have a read-only filesystem (except /tmp),
// so diskStorage crashes in production. Memory storage lets us base64-encode
// the buffer and save it as a plain string field in MongoDB.
const storage = multer.memoryStorage();

const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|xlsx|xls|csv|doc|docx/;

const fileFilter = (req, file, cb) => {
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (ext) return cb(null, true);
  cb(new Error("Unsupported file type"));
};

const upload = multer({
  storage,
  fileFilter,
  // NOTE: MongoDB documents have a hard 16MB limit, and base64 encoding
  // inflates the original file size by ~33%. Keep this well under 16MB.
  // Lowered from 25MB to keep encoded images/docs safely inside that limit.
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

module.exports = upload;
