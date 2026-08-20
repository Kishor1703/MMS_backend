/**
 * Bootstrap script for the first Owner login, since the register endpoint
 * requires an existing privileged user to be authenticated.
 *
 * Usage:
 *   npm run seed:owner
 *   npm run seed:owner -- --reset-password
 *
 * Set BOOTSTRAP_OWNER_NAME, BOOTSTRAP_OWNER_EMAIL,
 * BOOTSTRAP_OWNER_PHONE, and BOOTSTRAP_OWNER_PASSWORD only in the shell or
 * in a temporary, git-ignored env file before running this script. The
 * password is never printed. Existing accounts are left unchanged unless
 * --reset-password is explicitly supplied.
 */
require("dotenv").config();
require("../config/mongoDns");
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  const email = process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_OWNER_PASSWORD;
  const resetPassword = process.argv.includes("--reset-password");

  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  if (!email || !password) {
    throw new Error(
      "BOOTSTRAP_OWNER_EMAIL and BOOTSTRAP_OWNER_PASSWORD are required"
    );
  }
  if (password.length < 6) {
    throw new Error("BOOTSTRAP_OWNER_PASSWORD must be at least 6 characters");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ email }).select("+password");

    if (existing) {
      if (!resetPassword) {
        console.log(
          `Owner already exists: ${email}. Use --reset-password to explicitly reset its password.`
        );
        return;
      }

      existing.password = password;
      await existing.save();
      console.log(`Password reset for existing owner: ${email}`);
      return;
    }

    await User.create({
      name: process.env.BOOTSTRAP_OWNER_NAME?.trim() || "System Owner",
      email,
      phoneNumber: process.env.BOOTSTRAP_OWNER_PHONE?.trim() || "0000000000",
      password,
      role: "owner",
    });
    console.log(`Owner account created: ${email}`);
  } finally {
    await mongoose.disconnect();
  }
})();
