require("dotenv").config({ path: "./config.env" });
const port = process.env.PORT || 3000;
const cors = require("cors")
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan")
const connectToDB = require("./db/mongoose.js");
const app = express();
const productRouter = require("./routers/product.route.js");
const cartRouter = require("./routers/cart.route.js");
const authRouter = require("./routers/auth.route.js");
const userRouter = require("./routers/user.route.js");
const categoryRouter = require("./routers/category.route.js");
const orderRouter = require("./routers/order.route.js");

const corsOptions = {
 origin: "http://localhost:5000",
  credentials: true,
  methods: ["POST", "PATCH", "DELETE", "GET"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

app.use((req, res, next) => {
  if (req.originalUrl === "/orders/webhook") {
    return next();
  }
  express.json()(req, res, next);
});
app.use(cookieParser());
app.use(cors(corsOptions))
app.use(morgan("dev"))
app.use(productRouter);
app.use(cartRouter);
app.use(authRouter);
app.use(userRouter);
app.use(categoryRouter);
app.use(orderRouter);




connectToDB();
app.listen(port, () => {
  console.log(`Connected to port ${port} successfully`);
});
