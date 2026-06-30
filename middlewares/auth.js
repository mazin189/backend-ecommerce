const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");

const auth = async(req, res, next) => {
  try {
    const token = req.cookies.access_token
    if (!token) {
      return res.status(401).send({ error: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded._id });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    req.user = user;
    req.decoded = decoded;

    next();
  } catch (e) {
    res.status(401).send({ error: "Invalid token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).send("Admins only");
  }
  next();
};

module.exports = {
  auth,
  isAdmin,
};
