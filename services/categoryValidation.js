const Joi = require("joi");

const categoryValidation = Joi.object({
  name: Joi.string().required().trim().min(2).max(50),
  image: Joi.string().optional(),
  description: Joi.string().optional().trim()
});

module.exports = categoryValidation;
