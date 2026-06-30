const Cart = require("../models/cartModel.js");
const Product = require("../models/productModel.js");
const asyncHandler = require("express-async-handler");


const addToCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).send("productId and quantity are required");
    }
    if(quantity <= 0 || !Number.isInteger(quantity)){
      return res.status(400).send("Quantity must be postive")
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
      });
    }

    const existedProduct = cart.items.find(
      (item) => item.productId.toString() === productId,
    );
    if (existedProduct) {
      existedProduct.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    const safeCart = cart.toObject();
    delete safeCart.__v;
    await cart.save();
    res.status(200).send({
      Message: "Product added to cart successfully",
      cart: safeCart,
    });
});

const getCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "-__v",
      })
      .select("-__v");
    if (!cart) {
      return res.status(200).send({
        cart: { items: [] },
        totalPrice: 0,
      });
    }
    let totalPrice = 0;
    cart.items.forEach((item) => {
      totalPrice += item.quantity * item.productId.price;
    });
    res.status(200).json({ cart, totalPrice });
});

const deleteFromCart = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).send("No cart found for this user");
    }
    const item = cart.items.find(
      (item) => item.productId.toString() === productId,
    );
    if (!item) {
      return res.status(404).send("Item not found in cart");
    }
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );
    const cartObj = cart.toObject();
    delete cartObj.__v;
    await cart.save();
    res.status(200).send({
      Message: "Product deleted from cart successfully",
      cart: cartObj,
    });
});

module.exports = {
  addToCart,
  getCart,
  deleteFromCart,
};
