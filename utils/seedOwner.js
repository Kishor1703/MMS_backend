/**
 * One-time script to create the first Owner login, since the register
 * endpoint requires an existing Owner to be authenticated.
 *
 * Usage:  node utils/seedOwner.js
 * Reads OWNER_NAME / OWNER_EMAIL / OWNER_PHONE / OWNER_PASSWORD from env,
 * or falls back to the defaults below (change the password after first login).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.OWNER_EMAIL || "owner@example.com";
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Owner already exists: ${email}`);
    process.exit(0);
  }

  const owner = await User.create({
    name: process.env.OWNER_NAME || "System Owner",
    email,
    phoneNumber: process.env.OWNER_PHONE || "0000000000",
    password: process.env.OWNER_PASSWORD || "ChangeMe123!",
    role: "owner",
  });

  console.log("Owner account created:");
  console.log(`  email: ${owner.email}`);
  console.log(`  password: ${process.env.OWNER_PASSWORD || "ChangeMe123!"} (change this immediately)`);
  process.exit(0);
})();
