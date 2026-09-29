const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" },
  );
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
  maxAge,
});

const sendAuthCookies = (res, { token, refreshToken }) => {
  res.cookie(ACCESS_TOKEN_COOKIE, token, cookieOptions(7 * 24 * 60 * 60 * 1000));
  if (refreshToken) {
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      cookieOptions(30 * 24 * 60 * 60 * 1000),
    );
  }
};

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions());
};

module.exports = {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  sendAuthCookies,
  clearAuthCookies,
};
