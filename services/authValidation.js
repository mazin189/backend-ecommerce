const Joi = require("joi");

const registerValidation = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  password: Joi.string()
    .required()
    .min(8)
    .max(30)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .messages({
      "string.pattern.base":
        "Password must contain uppercase, lowercase and number",
    }),
  email: Joi.string().required().email(),
  role: Joi.string().optional(),
});

const loginValidation = Joi.object({
  password: Joi.string()
    .required()
    .min(8)
    .max(30)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .messages({
      "string.pattern.base":
        "Password must contain uppercase, lowercase and number",
    }),
  email: Joi.string().required().email(),
});

module.exports = {
  registerValidation,
  loginValidation,
};
