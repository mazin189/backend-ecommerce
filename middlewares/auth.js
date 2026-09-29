const asyncHandler = require("express-async-handler");
const User = require("../models/userModel.js");
const {
  ACCESS_TOKEN_COOKIE,
  verifyToken,
} = require("../services/token.service.js");

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }
  if (req.cookies && req.cookies[ACCESS_TOKEN_COOKIE]) {
    return req.cookies[ACCESS_TOKEN_COOKIE];
  }
  return null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).send({ error: "Not authorized, no token" });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (e) {
    return res.status(401).send({ error: "Not authorized, token failed" });
  }

  const user = await User.findById(decoded.id || decoded._id);
  if (!user) {
    return res.status(401).send({ error: "User no longer exists" });
  }

  req.user = user;
  req.decoded = decoded;
  next();
});

const allowedTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).send({ error: "Not authorized, no token" });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .send({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };

module.exports = {
  protect,
  allowedTo,
};
