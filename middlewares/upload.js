const multer = require("multer");
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpg", "image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
module.exports = upload;
