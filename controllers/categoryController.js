const Category = require("../models/categoryModel.js");
const uploadImage = require("../services/cloudinary.service.js")
const asyncHandler = require("express-async-handler");


const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({}).select("-__v");
    if (categories.length === 0) {
      return res.status(200).send("No categories available");
    }
    res.status(200).send({ categories });
});

const getOneCategory = asyncHandler(async (req, res) => {
    const _id = req.params.id;
    const category = await Category.findById(_id).select("-__v");
    if (!category) {
      return res.status(404).send("Category not found");
    }
    res.status(200).send({ category });
});

const createCategory = asyncHandler(async (req, res) => {
     const categoryMatch = await Category.findOne({name : req.body.name})
    if(categoryMatch){
      return res.status(400).send("Category name already exists")
    }
    if(!req.file){
      return res.status(400).send("Image for category is required")
    }
    const result = await uploadImage(req.file.buffer, "Categories")
    const category = await Category.create({
      name: req.body.name,
      description: req.body.description,
      image: result.secure_url,
    });
   
    const safeCategory = category.toObject();
    delete safeCategory.__v;
    res.status(201).send({
      Message: "Category created successfully.",
      Category: safeCategory,
    });
});

const deleteCategory = asyncHandler(async (req, res) => {
    const _id = req.params.id;
    const category = await Category.findByIdAndDelete(_id);
    if (!category) {
      return res.status(404).send("Category not found");
    }
    res.status(200).send("Deleted successfully");
});

const updateCategory = asyncHandler(async (req, res) => {
    const updates = {...req.body}
    if(req.file){
      const result = await uploadImage(req.file.buffer, "Categories")
      updates.image = result.secure_url
    }
    const _id = req.params.id;
    const category = await Category.findByIdAndUpdate(
      _id,updates,{
        new: true,
        runValidators: true,
      },
    ).select("-__v");
    if (!category) {
      return res.status(404).send("Category not found");
    }
    res.status(200).send({
      Message: "Updated successfully",
      category,
    });
});

module.exports = {
  getOneCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  createCategory,
};
