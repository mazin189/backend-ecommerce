const Product = require("../models/productModel.js");
const uploadImage = require("../services/cloudinary.service.js");
const Category = require("../models/categoryModel.js")
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose")

const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({});
    res.status(200).send(products);
});

const addProduct = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).send("Image is required");
    }
    const result = await uploadImage(req.file.buffer, "Products");
    const {category} = req.body
    if(!mongoose.Types.ObjectId.isValid(category)){
      return res.status(400).send("Invalid category id")
    }
    
    const categoryExist = await Category.findById(category)
    if (!categoryExist) {
      return res.status(404).send("Category not exist")
    }
    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      img: result.secure_url,
    });
    const productObject = product.toObject();
    delete productObject.__v;
    res.status(201).send({ Product: productObject });
});

const getProductById = asyncHandler(async (req, res) => {
    const _id = req.params.id;
    const product = await Product.findById(_id).select("-__v");
    if (!product) {
      return res.status(404).send("Product not found.");
    }
    res.status(200).send(product);
});

const updateProduct = asyncHandler(async (req, res) => {
    const updates = {...req.body}
    if(req.file){
      const result = await uploadImage(req.file.buffer, "Products")
      updates.img = result.secure_url
    }
    const _id = req.params.id;
    const product = await Product.findByIdAndUpdate(_id, updates, {
      new: true,
      runValidators: true,
    }).select("-__v");
    if(!product){
      return res.status(404).send("Product not found")
    }
    res.status(200).send(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
    const _id = req.params.id;
    const product = await Product.findByIdAndDelete(_id);
     if(!product){
      return res.status(404).send("Product not found")
    }
    res.status(200).send("Product deleted succesfully.");
});

module.exports = {
  getAllProducts,
  addProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
