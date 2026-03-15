const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

/* =========================
   CORS CONFIG
========================= */

app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   DATABASE
========================= */

require("./config/db");

/* =========================
   ROUTES
========================= */

const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const referralRoutes = require("./routes/referral");
const adminRoutes = require("./routes/admin");
const adminAuthRoutes = require("./routes/adminAuth");
const challengeRoutes = require("./routes/challenge");
const notificationRoutes = require("./routes/notifications");
const adminNotificationRoutes = require("./routes/adminNotification");

/* =========================
   STATIC FILES
========================= */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/adminAuth", adminAuthRoutes);
app.use("/api/challenge", challengeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/notification", adminNotificationRoutes);

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server running successfully"
  });
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    success:false,
    message:"Route not found"
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success:false,
    message:"Internal server error"
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT,"0.0.0.0",()=>{
  console.log(`Server running on port ${PORT}`);
});

/* =========================
   CRASH HANDLING
========================= */

process.on("unhandledRejection",(err)=>{
  console.error("Unhandled Rejection:",err);
});

process.on("uncaughtException",(err)=>{
  console.error("Uncaught Exception:",err);
  process.exit(1);
});
