const multer = require("multer");
const path = require("path");

// Konfigurasi storage untuk simpan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder tujuan
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // nama unik
  },
});

const upload = multer({ storage });

module.exports = upload;
