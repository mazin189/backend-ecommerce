const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    image: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

const categoryModel = mongoose.model("Category", categorySchema);

module.exports = categoryModel;
