const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  deleteFromCart,
} = require("../controllers/cartController.js");
const { protect } = require("../middlewares/auth.js");

router.route("/cart").get(protect, getCart).post(protect, addToCart);
router.route("/cart/:id").delete(protect, deleteFromCart);

module.exports = router;
