const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfileData,
  getProfile,
} = require("../controllers/userController.js");
const { protect, allowedTo } = require("../middlewares/auth.js");
const upload = require("../middlewares/upload.js")

router.route("/users").get(protect, allowedTo("admin"), getAllUsers);
router.route("/users/:id").get(protect, allowedTo("admin"), getUserById);
router.route("/profile").get(protect, getProfile).patch(protect, upload.single("image"), updateProfileData);

module.exports = router;
