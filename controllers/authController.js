const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @desc    Register a new user (Owner creates Employee logins; first Owner
//          account is typically seeded directly in the DB or via a setup script)
// @route   POST /api/auth/register
// @access  Owner
const register = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, password, role, employee } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    phoneNumber,
    password,
    role: role || "employee",
    employee,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    },
  });
});

// @desc    Login (Owner or Employee)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      token: generateToken(user._id),
    },
  });
});

// @desc    Current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// @desc    Change password (while logged in)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated" });
});

// @desc    Request a password reset token (emailed/SMS'd to the user in prod)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // Don't reveal whether the email exists
    return res.json({ success: true, message: "If that email exists, a reset link was sent" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 min
  await user.save({ validateBeforeSave: false });

  // TODO: send resetToken via email/SMS through the notification service
  res.json({
    success: true,
    message: "If that email exists, a reset link was sent",
    // resetToken is only returned here for local dev/testing convenience.
    ...(process.env.NODE_ENV !== "production" && { devResetToken: resetToken }),
  });
});

// @desc    Reset password using token from forgotPassword
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    res.status(400);
    throw new Error("Reset token is invalid or has expired");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true, message: "Password reset successful" });
});

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
