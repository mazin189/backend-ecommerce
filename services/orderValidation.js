const Joi = require("joi");
const Order = require("../models/orderModel.js");

const shippingAddressValidation = Joi.object({
  fullName: Joi.string().required().min(3).max(100),
  phone: Joi.string().required().min(6).max(20),
  country: Joi.string().required(),
  city: Joi.string().required(),
  address: Joi.string().required(),
  postalCode: Joi.string().optional().allow(""),
});

const createOrderValidation = Joi.object({
  shippingAddress: shippingAddressValidation.required(),
  paymentMethod: Joi.string().valid("cash", "stripe").optional(),
  customerNote: Joi.string().optional().allow("").max(1000),
});

const updateOrderStatusValidation = Joi.object({
  status: Joi.string()
    .valid(...Order.ORDER_STATUSES)
    .required(),
  adminNote: Joi.string().optional().allow("").max(1000),
});

module.exports = {
  createOrderValidation,
  updateOrderStatusValidation,
};
