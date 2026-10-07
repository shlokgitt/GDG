const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

exports.registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

exports.loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) {
    throw new AppError(409, "Email already registered");
  }
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
  });
  res.status(201).json({ user: publicUser(user), token: signToken(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password"); // same message for both cases
  }
  res.json({ user: publicUser(user), token: signToken(user) });
});