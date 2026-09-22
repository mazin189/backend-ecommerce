const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    img: {
      type: String,
      required: true,
    },
    price: {
      required: true,
      type: Number,
    },
    rating: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    alt: {
      type: String,
    },
    name: {
      required: true,
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;
