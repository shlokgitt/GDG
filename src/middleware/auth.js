const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

exports.authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new AppError(401, "Authentication required");

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.id);
  if (!user) throw new AppError(401, "User no longer exists");

  req.user = user;
  next();
});

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError(403, "You are not allowed to do this");
  next();
};