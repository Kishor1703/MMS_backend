const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"])
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Serve uploaded files statically
app.use(
  "/uploads",
  express.static(path.join(__dirname, process.env.UPLOAD_DIR || "uploads"))
);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/machines", require("./routes/machineRoutes"));
app.use("/api/maintenance", require("./routes/maintenanceRoutes"));
app.use("/api/oil-changes", require("./routes/oilChangeRoutes"));
app.use("/api/spare-parts", require("./routes/sparePartRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

app.get("/api/health", (req, res) => res.json({ success: true, message: "API is running" }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
