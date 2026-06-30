const Joi = require("joi");

const productValidation = Joi.object({
  name: Joi.string().required().min(3).max(100),
  img: Joi.string().optional(),
  price: Joi.number().required().min(0),
  rating: Joi.number().optional().min(0).max(5),
  description: Joi.string().required(),
  category: Joi.string().required(),
  alt: Joi.string().optional(),
});

module.exports = productValidation;
