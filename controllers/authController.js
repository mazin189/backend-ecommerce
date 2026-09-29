const User = require("../models/userModel.js");
const asyncHandler = require("express-async-handler");
const {
  REFRESH_TOKEN_COOKIE,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  sendAuthCookies,
  clearAuthCookies,
} = require("../services/token.service.js");

const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  const existedUser = await User.findOne({
    $or: [{ email }, ...(username ? [{ username }] : [])],
  });
  if (existedUser) {
    return res.status(400).send({ error: "User already exists" });
  }

  const user = await User.create({ name, username, email, password });
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  sendAuthCookies(res, { token, refreshToken });

  res.status(201).send({
    message: "User created successfully",
    user: user.toObject(),
    token,
    refreshToken,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  const user = await User.findOne(
    email ? { email } : { username },
  ).select("+password");
  if (!user) {
    return res.status(401).send({ error: "Invalid credentials" });
  }

  const validPassword = await user.comparePassword(password);
  if (!validPassword) {
    return res.status(401).send({ error: "Invalid credentials" });
  }

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  sendAuthCookies(res, { token, refreshToken });

  res.status(200).send({
    message: "Logged in successfully",
    user: user.toObject(),
    token,
    refreshToken,
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).send({ user: req.user.toObject() });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies[REFRESH_TOKEN_COOKIE];
  if (!token) {
    return res.status(401).send({ error: "Not authorized, no token" });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (e) {
    return res.status(401).send({ error: "Not authorized, token failed" });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).send({ error: "User no longer exists" });
  }

  const accessToken = generateToken(user);
  sendAuthCookies(res, { token: accessToken });
  res.status(200).send({ token: accessToken });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  res.status(200).send({ message: "Logged out successfully" });
});

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
};
