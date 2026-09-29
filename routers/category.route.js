const express = require("express");
const router = express.Router();

const {
  getOneCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  createCategory,
} = require("../controllers/categoryController.js");
const { protect, allowedTo } = require("../middlewares/auth.js");
const validate = require("../middlewares/validate.js");
const categoryValidation = require("../services/categoryValidation.js");
const upload = require("../middlewares/upload.js");

router
  .route("/category")
  .get(getAllCategories)
  .post(
    protect,
    allowedTo("admin"),
    upload.single("image"),
    validate(categoryValidation),
    createCategory,
  );
router
  .route("/category/:id")
  .delete(protect, allowedTo("admin"), deleteCategory)
  .patch(protect, allowedTo("admin"), upload.single("image"), updateCategory)
  .get(getOneCategory);

module.exports = router;
