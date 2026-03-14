const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// CORS — allow all origins (restrict to your frontend URL in production if needed)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : "*";

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection (imported here so it runs at startup and exits on failure)
require("./config/db");

// Routes
const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const referralRoutes = require("./routes/referral");
const adminRoutes = require("./routes/admin");
const adminAuthRoutes = require("./routes/adminAuth");
const challengeRoutes = require("./routes/challenge");
const notificationRoutes = require("./routes/notifications");
const adminNotificationRoutes = require("./routes/adminNotification");

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/adminAuth", adminAuthRoutes);
app.use("/api/challenge", challengeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/notification", adminNotificationRoutes);

// Health check / root route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler — catches errors thrown by route handlers
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// Start Server — bind to 0.0.0.0 so Render can expose the port
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);
});

// Crash logging
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
