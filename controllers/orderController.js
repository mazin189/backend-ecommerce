const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel.js");
const Cart = require("../models/cartModel.js");
const Product = require("../models/productModel.js");
const User = require("../models/userModel.js");
const stripe = require("../config/stripe.js");
const {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} = require("../services/email.service.js");

const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_FEE = 50;
const TAX_RATE = 0.14;

const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

const MAX_PAGE_SIZE = 100;
const SORTABLE_FIELDS = ["createdAt", "totalPrice", "status", "paymentStatus"];

const round = (value) => Math.round(value * 100) / 100;

const getPagination = (query) => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const requested = Number(query.limit) > 0 ? Number(query.limit) : 10;
  return { page, limit: Math.min(requested, MAX_PAGE_SIZE) };
};

const getSort = (sort) => {
  if (!sort) {
    return { createdAt: -1 };
  }
  const field = sort.startsWith("-") ? sort.slice(1) : sort;
  if (!SORTABLE_FIELDS.includes(field)) {
    return null;
  }
  return { [field]: sort.startsWith("-") ? -1 : 1 };
};

const getCouponDiscount = (cart, subtotal) => {
  const coupon = cart.coupon;
  if (!coupon || !coupon.code) {
    return 0;
  }
  if (coupon.discountType === "percentage") {
    return round((subtotal * coupon.discountValue) / 100);
  }
  return round(Math.min(coupon.discountValue, subtotal));
};

const calculateTotals = (items, cart) => {
  const subtotal = round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = round(subtotal * TAX_RATE);
  const discount = getCouponDiscount(cart, subtotal);
  const totalPrice = round(
    Math.max(subtotal + shippingFee + tax - discount, 0),
  );
  return { subtotal, shippingFee, tax, discount, totalPrice };
};

const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod = "cash", customerNote } = req.body;

  if (paymentMethod === "stripe" && !stripe) {
    return res.status(503).send("Stripe payment is not configured");
  }

  const session = await mongoose.startSession();
  let createdOrder;
  let clientSecret;
  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const products = await Product.find({
        _id: { $in: cart.items.map((item) => item.productId) },
      }).session(session);

      const items = cart.items.map((item) => {
        const product = products.find(
          (doc) => doc._id.toString() === item.productId.toString(),
        );
        if (!product) {
          throw new Error("A product in the cart no longer exists");
        }
        if (product.stock < item.quantity) {
          throw new Error(`Not enough stock for product ${product.name}`);
        }
        return {
          productId: product._id,
          name: product.name,
          image: product.img,
          price: product.price,
          quantity: item.quantity,
        };
      });

      const totals = calculateTotals(items, cart);

      for (const item of items) {
        const updated = await Product.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        );
        if (updated.modifiedCount === 0) {
          throw new Error(`Not enough stock for product ${item.name}`);
        }
      }

      const orders = await Order.create(
        [
          {
            userId,
            items,
            shippingAddress,
            paymentMethod,
            customerNote,
            ...totals,
          },
        ],
        { session },
      );
      createdOrder = orders[0];

      if (paymentMethod === "stripe") {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(createdOrder.totalPrice * 100),
          currency: "egp",
          metadata: {
            orderId: createdOrder._id.toString(),
            userId: userId.toString(),
          },
        });
        createdOrder.transactionId = paymentIntent.id;
        clientSecret = paymentIntent.client_secret;
        await createdOrder.save({ session });
      }

      cart.items = [];
      cart.coupon = undefined;
      await cart.save({ session });
    });
  } catch (e) {
    return res.status(400).send({ error: e.message });
  } finally {
    await session.endSession();
  }

  await sendOrderConfirmationEmail(req.user, createdOrder);

  const orderObject = createdOrder.toObject();
  delete orderObject.__v;
  res.status(201).send({
    Message: "Order created successfully",
    Order: orderObject,
    ClientSecret: clientSecret,
  });
});

const stripeWebhook = asyncHandler(async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send("Stripe webhook is not configured");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }

  const paymentIntent = event.data.object;

  if (event.type === "payment_intent.succeeded") {
    const order = await Order.findOne({ transactionId: paymentIntent.id });
    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
      if (order.status === "pending") {
        order.status = "confirmed";
      }
      await order.save();
      const customer = await User.findById(order.userId).select("name email");
      if (customer) {
        await sendOrderStatusEmail(customer, order);
      }
    }
  } else if (event.type === "payment_intent.payment_failed") {
    await Order.updateOne(
      { transactionId: paymentIntent.id },
      { paymentStatus: "failed" },
    );
  }

  res.status(200).send({ received: true });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit } = getPagination(req.query);
  const filter = { userId };

  if (req.query.status) {
    if (!Order.ORDER_STATUSES.includes(req.query.status)) {
      return res.status(400).send("Invalid order status");
    }
    filter.status = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v"),
    Order.countDocuments(filter),
  ]);

  res.status(200).send({
    Orders: orders,
    Pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getMyOrderById = asyncHandler(async (req, res) => {
  const _id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send("Invalid order id");
  }
  const order = await Order.findOne({ _id, userId: req.user._id }).select(
    "-__v -adminNote",
  );
  if (!order) {
    return res.status(404).send("Order not found");
  }
  res.status(200).send({ Order: order });
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const _id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send("Invalid order id");
  }

  const session = await mongoose.startSession();
  let cancelledOrder;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id, userId: req.user._id }).session(
        session,
      );
      if (!order) {
        throw new Error("Order not found");
      }
      if (!["pending", "confirmed"].includes(order.status)) {
        throw new Error(`An order with status ${order.status} cannot be cancelled`);
      }

      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } },
          { session },
        );
      }

      order.status = "cancelled";
      order.cancelledAt = new Date();
      cancelledOrder = await order.save({ session });
    });
  } catch (e) {
    const status = e.message === "Order not found" ? 404 : 400;
    return res.status(status).send({ error: e.message });
  } finally {
    await session.endSession();
  }

  await sendOrderStatusEmail(req.user, cancelledOrder);

  res.status(200).send({
    Message: "Order cancelled successfully",
    Order: cancelledOrder,
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    if (!Order.ORDER_STATUSES.includes(req.query.status)) {
      return res.status(400).send("Invalid order status");
    }
    filter.status = req.query.status;
  }
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }
  if (req.query.paymentMethod) {
    filter.paymentMethod = req.query.paymentMethod;
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) {
      filter.createdAt.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      filter.createdAt.$lte = new Date(req.query.to);
    }
  }

  const sort = getSort(req.query.sort);
  if (!sort) {
    return res.status(400).send("Invalid sort field");
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate({ path: "userId", select: "name email" })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v"),
    Order.countDocuments(filter),
  ]);

  res.status(200).send({
    Orders: orders,
    Pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const _id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send("Invalid order id");
  }
  const order = await Order.findById(_id)
    .populate({ path: "userId", select: "name email image" })
    .select("-__v");
  if (!order) {
    return res.status(404).send("Order not found");
  }
  res.status(200).send({ Order: order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const _id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send("Invalid order id");
  }
  const { status, adminNote } = req.body;

  const session = await mongoose.startSession();
  let updatedOrder;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(_id).session(session);
      if (!order) {
        throw new Error("Order not found");
      }
      if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
        throw new Error(
          `Cannot change the order status from ${order.status} to ${status}`,
        );
      }

      if (["cancelled", "returned"].includes(status)) {
        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
      }

      if (status === "cancelled") {
        order.cancelledAt = new Date();
      }
      if (status === "delivered") {
        order.deliveredAt = new Date();
        if (order.paymentMethod === "cash" && order.paymentStatus === "pending") {
          order.paymentStatus = "paid";
          order.paidAt = new Date();
        }
      }
      if (adminNote !== undefined) {
        order.adminNote = adminNote;
      }
      order.status = status;
      updatedOrder = await order.save({ session });
    });
  } catch (e) {
    const status = e.message === "Order not found" ? 404 : 400;
    return res.status(status).send({ error: e.message });
  } finally {
    await session.endSession();
  }

  const customer = await User.findById(updatedOrder.userId).select("name email");
  if (customer) {
    await sendOrderStatusEmail(customer, updatedOrder);
  }

  res.status(200).send({
    Message: "Order status updated successfully",
    Order: updatedOrder,
  });
});

const getAllCarts = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const filter = { "items.0": { $exists: true } };

  const [carts, total] = await Promise.all([
    Cart.find(filter)
      .populate({ path: "userId", select: "name email" })
      .populate({ path: "items.productId", select: "name price img stock" })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v"),
    Cart.countDocuments(filter),
  ]);

  const activeCarts = carts.map((cart) => {
    const cartObject = cart.toObject();
    cartObject.subtotal = round(
      cart.items.reduce(
        (sum, item) => sum + (item.productId?.price || 0) * item.quantity,
        0,
      ),
    );
    cartObject.itemCount = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    return cartObject;
  });

  res.status(200).send({
    Carts: activeCarts,
    Pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const paidFilter = { status: { $nin: ["cancelled", "returned"] } };

  const [
    revenue,
    monthRevenue,
    lastMonthRevenue,
    statusCounts,
    topProducts,
    dailyRevenue,
    recentOrders,
    totalCustomers,
  ] = await Promise.all([
    Order.aggregate([
      { $match: paidFilter },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          ...paidFilter,
          createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: paidFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: "userId", select: "name email" })
      .select("-__v"),
    User.countDocuments({ role: { $ne: "admin" } }),
  ]);

  const monthTotal = monthRevenue[0]?.total || 0;
  const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
  const growth =
    lastMonthTotal === 0
      ? monthTotal > 0
        ? 100
        : 0
      : round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100);

  const ordersByStatus = Order.ORDER_STATUSES.reduce((acc, status) => {
    acc[status] =
      statusCounts.find((entry) => entry._id === status)?.count || 0;
    return acc;
  }, {});

  res.status(200).send({
    Revenue: {
      total: round(revenue[0]?.total || 0),
      thisMonth: round(monthTotal),
      lastMonth: round(lastMonthTotal),
      growthPercentage: growth,
    },
    Orders: {
      total: revenue[0]?.count || 0,
      byStatus: ordersByStatus,
    },
    TopProducts: topProducts,
    DailyRevenue: dailyRevenue,
    RecentOrders: recentOrders,
    TotalCustomers: totalCustomers,
  });
});

module.exports = {
  createOrder,
  stripeWebhook,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getAllCarts,
  getDashboard,
};
