const Joi = require("joi");

const passwordRule = Joi.string()
  .required()
  .min(8)
  .max(30)
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
  .messages({
    "string.pattern.base":
      "Password must contain uppercase, lowercase and number",
  });

const registerValidation = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  password: passwordRule,
  email: Joi.string().required().email(),
});

const loginValidation = Joi.object({
  password: passwordRule,
  email: Joi.string().email(),
  username: Joi.string().alphanum().min(3).max(30),
})
  .xor("email", "username")
  .messages({
    "object.xor": "Provide either email or username",
    "object.missing": "Provide either email or username",
  });

const refreshValidation = Joi.object({
  refreshToken: Joi.string().optional(),
});

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
};
