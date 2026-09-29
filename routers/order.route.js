const express = require("express");
const router = express.Router();
const {
  createOrder,
  stripeWebhook,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboard,
} = require("../controllers/orderController.js");
const { protect, allowedTo } = require("../middlewares/auth.js");
const validate = require("../middlewares/validate.js");
const {
  createOrderValidation,
  updateOrderStatusValidation,
} = require("../services/orderValidation.js");

router
  .route("/orders/webhook")
  .post(express.raw({ type: "application/json" }), stripeWebhook);

router.route("/orders").post(protect, validate(createOrderValidation), createOrder);
router.route("/orders/my").get(protect, getMyOrders);
router.route("/orders/my/:id").get(protect, getMyOrderById);
router.route("/orders/my/:id/cancel").patch(protect, cancelMyOrder);

router.route("/orders/admin/dashboard").get(protect, allowedTo("admin"), getDashboard);
router.route("/orders/admin").get(protect, allowedTo("admin"), getAllOrders);
router.route("/orders/admin/:id").get(protect, allowedTo("admin"), getOrderById);
router
  .route("/orders/admin/:id/status")
  .patch(protect, allowedTo("admin"), validate(updateOrderStatusValidation), updateOrderStatus);

module.exports = router;
