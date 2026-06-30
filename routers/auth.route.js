const { login, register } = require("../controllers/authController.js");
const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate.js");
const {
  registerValidation,
  loginValidation,
} = require("../services/authValidation.js");

router.route("/login").post(validate(loginValidation), login);
router.route("/register").post(validate(registerValidation), register);

module.exports = router;
