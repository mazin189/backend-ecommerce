const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  deleteFromCart,
} = require("../controllers/cartController.js");
const { auth } = require("../middlewares/auth.js");

router.route("/cart").get(auth, getCart).post(auth, addToCart);
router.route("/cart/:id").delete(auth, deleteFromCart);

module.exports = router;
