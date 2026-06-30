const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  addProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController.js");
const { auth, isAdmin } = require("../middlewares/auth.js");
const productValidation = require("../services/productValidation.js");
const validate = require("../middlewares/validate.js");
const upload = require("../middlewares/upload.js");

router
  .route("/products")
  .get(getAllProducts)
  .post(
    auth,
    isAdmin,
    upload.single("image"),
    validate(productValidation),
    addProduct,
  );
router
  .route("/products/:id")
  .get(getProductById)
  .patch(auth, isAdmin, upload.single("image"), updateProduct)
  .delete(auth, isAdmin, deleteProduct);

module.exports = router;
