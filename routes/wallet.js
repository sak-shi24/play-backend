const createNotification = require("../utils/notification");
const express = require("express");
const router = express.Router();
const db = require("../config/db");

const multer = require("multer");
const path = require("path");

/* =========================
   MULTER STORAGE
========================= */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

/* =========================
   Profile
========================= */
router.get("/profile/:id", (req, res) => {
  const userId = req.params.id;

  db.query(
    "SELECT id, name, email, phone FROM users WHERE id=?",
    [userId],
    (err, rows) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success:false, message:"Server error" });
      }

      if (rows.length === 0) {
        return res.json({ success:false, message:"User not found" });
      }

      res.json({ success:true, user: rows[0] });
    }
  );
});

/* =========================
   profile update
========================= */
router.post("/profile/update", (req, res) => {
  const { userId, name, email, phone, password } = req.body;

  const sql = password
    ? "UPDATE users SET name=?, email=?, phone=?, password=? WHERE id=?"
    : "UPDATE users SET name=?, email=?, phone=? WHERE id=?";

  const values = password
    ? [name, email, phone, password, userId]
    : [name, email, phone, userId];

  db.query(sql, values, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success:false, message:"Server error" });
    }

    res.json({ success:true, message:"Profile updated successfully" });
  });
});

/* =========================
   GET WALLET BALANCE
========================= */
router.get("/balance/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    "SELECT wallet FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(500).json({ message: "Server error" });

      res.json({ wallet: result[0].wallet });
    }
  );
});

/* =========================
   GET DEPOSIT QR
========================= */
router.get("/qr", (req, res) => {
  db.query(
    "SELECT qr_image FROM deposit_qr ORDER BY id DESC LIMIT 1",
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (!rows.length) {
        return res.json({ qr: "" });
      }

      // ⭐ IMPORTANT → uploads path add karo
      res.json({ qr: rows[0].qr_image });
    }
  );
});

/* =========================
   DEPOSIT REQUEST
========================= */
router.post("/deposit", upload.single("screenshot"), (req, res) => {
  const { user_id, amount } = req.body;
  const screenshotPath = req.file ? req.file.filename : null;

  if (!user_id || !amount || !screenshotPath)
    return res.status(400).json({ message: "All fields required" });

  db.query(
    "INSERT INTO deposits (user_id, amount, screenshot, status) VALUES (?, ?, ?, 'pending')",
    [user_id, amount, screenshotPath],
    (err) => {
      if (err) return res.status(500).json({ message: "Deposit request failed" });

      createNotification({
        admin: 1,
        message: "New deposit request submitted"
      });

      res.json({ message: "Deposit request submitted" });
    }
  );
});

/* =========================
   WITHDRAW REQUEST
========================= */
router.post("/withdraw", upload.single("qr_image"), (req, res) => {
  const { user_id, amount } = req.body;
  const qrImage = req.file ? req.file.filename : null;

  if (!user_id || !amount || !qrImage)
    return res.status(400).json({ message: "All fields required" });

  db.query(
    "INSERT INTO withdrawals (user_id, amount, qr_image, status) VALUES (?, ?, ?, 'pending')",
    [user_id, amount, qrImage],
    (err) => {
      if (err) return res.status(500).json({ message: "Withdraw request failed" });

      createNotification({
        admin: 1,
        message: "New withdraw request submitted"
      });

      res.json({ message: "Withdraw request submitted" });
    }
  );
});

/* =========================
   USER TRANSACTIONS
========================= */
router.get("/transactions/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const depositQuery = `
    SELECT amount, 'Deposit' AS type, status, created_at 
    FROM deposits WHERE user_id = ?
  `;

  const withdrawQuery = `
    SELECT amount, 'Withdraw' AS type, status, created_at 
    FROM withdrawals WHERE user_id = ?
  `;

  db.query(depositQuery, [user_id], (err, deposits) => {
    if (err) return res.status(500).json({ message: "Server error" });

    db.query(withdrawQuery, [user_id], (err2, withdrawals) => {
      if (err2) return res.status(500).json({ message: "Server error" });

      const transactions = [...deposits, ...withdrawals];
      transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json(transactions);
    });
  });
});

/* =========================
   HELP REQUEST
========================= */
router.post("/help-request", (req, res) => {
  const { name, contact, message } = req.body;

  if (!name || !contact || !message)
    return res.status(400).json({ message: "All fields required" });

  db.query(
    "INSERT INTO help_requests (name, contact, message) VALUES (?, ?, ?)",
    [name, contact, message],
    (err) => {
      if (err) return res.status(500).json({ message: "Server error" });

      createNotification({
        admin: 1,
        message: "New help request received"
      });

      res.json({ message: "Help request submitted" });
    }
  );
});

module.exports = router;
