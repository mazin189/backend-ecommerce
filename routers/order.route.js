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
  getAllCarts,
  getDashboard,
} = require("../controllers/orderController.js");
const { auth, isAdmin } = require("../middlewares/auth.js");
const validate = require("../middlewares/validate.js");
const {
  createOrderValidation,
  updateOrderStatusValidation,
} = require("../services/orderValidation.js");

router
  .route("/orders/webhook")
  .post(express.raw({ type: "application/json" }), stripeWebhook);

router.route("/orders").post(auth, validate(createOrderValidation), createOrder);
router.route("/orders/my").get(auth, getMyOrders);
router.route("/orders/my/:id").get(auth, getMyOrderById);
router.route("/orders/my/:id/cancel").patch(auth, cancelMyOrder);
router.route("/my/:id/cancel").patch(auth, cancelMyOrder);

router.route("/orders/admin/dashboard").get(auth, isAdmin, getDashboard);
router.route("/orders/admin/carts").get(auth, isAdmin, getAllCarts);
router.route("/orders/admin").get(auth, isAdmin, getAllOrders);
router.route("/orders/admin/:id").get(auth, isAdmin, getOrderById);
router
  .route("/orders/admin/:id/status")
  .patch(auth, isAdmin, validate(updateOrderStatusValidation), updateOrderStatus);

router.route("/admin/dashboard").get(auth, isAdmin, getDashboard);
router.route("/admin/carts").get(auth, isAdmin, getAllCarts);
router.route("/admin").get(auth, isAdmin, getAllOrders);
router.route("/admin/:id").get(auth, isAdmin, getOrderById);
router
  .route("/admin/:id/status")
  .patch(auth, isAdmin, validate(updateOrderStatusValidation), updateOrderStatus);

module.exports = router;
