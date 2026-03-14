const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors({
  origin:"*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]}))
app.use(express.json()); 
const path = require("path");

const db = require("./config/db"); // Ensure this connects properly to MySQL

// Routes
const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const referralRoutes = require("./routes/referral");
const adminRoutes = require("./routes/admin");
const adminAuthRoutes = require("./routes/adminAuth");
const challengeRoutes = require("./routes/challenge");
const notificationRoutes = require("./routes/notifications");
const adminNotificationRoutes = require("./routes/adminNotification");




app.use(express.urlencoded({ extended: true })); // Optional, for form submissions

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


// Test route
app.get("/", (req, res) => {
  res.send("MySQL Server Running");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Optional: Handle uncaught errors
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
