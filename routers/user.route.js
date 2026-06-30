const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfileData,
  getProfile,
} = require("../controllers/userController.js");
const { auth, isAdmin } = require("../middlewares/auth.js");
const upload = require("../middlewares/upload.js")

router.route("/users").get(auth, isAdmin, getAllUsers);
router.route("/users/:id").get(auth, isAdmin, getUserById);
router.route("/profile").get(auth, getProfile).patch(auth, upload.single("image"), updateProfileData);

module.exports = router;
