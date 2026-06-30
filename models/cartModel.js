const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema(
  {
    items: [
      {
        quantity: {
          type: Number,
          min: 1,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true },
);

const cartModel = mongoose.model("Cart", cartSchema);

module.exports = cartModel;
