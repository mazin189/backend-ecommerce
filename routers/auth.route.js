const express = require("express");
const router = express.Router();
const {
  login,
  register,
  getMe,
  refresh,
  logout,
} = require("../controllers/authController.js");
const { protect } = require("../middlewares/auth.js");
const validate = require("../middlewares/validate.js");
const {
  registerValidation,
  loginValidation,
  refreshValidation,
} = require("../services/authValidation.js");

router.route("/register").post(validate(registerValidation), register);
router.route("/login").post(validate(loginValidation), login);
router.route("/refresh").post(validate(refreshValidation), refresh);
router.route("/me").get(protect, getMe);
router.route("/logout").post(protect, logout);

module.exports = router;
