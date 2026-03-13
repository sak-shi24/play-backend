const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* =========================
   REGISTER
========================= */
router.post("/register", (req, res) => {
  const { name, email, phone, password, referral } = req.body;

  if (!name || !email || !phone || !password) {
    return res.json({ success:false, message: "All fields required" });
  }

  // Check existing user
  db.query(
    "SELECT * FROM users WHERE phone = ? OR email = ?",
    [phone, email],
    (err, users) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success:false, message: "Server error" });
      }

      if (users.length > 0) {
        return res.json({ success:false, message: "User already exists" });
      }

      // Insert user
      db.query(
        "INSERT INTO users (name, email, phone, password, referred_by) VALUES (?, ?, ?, ?, ?)",
        [name, email, phone, password, referral || null],
        (err2, result) => {
          if (err2) {
            console.log(err2);
            return res.status(500).json({ success:false, message: "Server error" });
          }

          const userId = result.insertId;
          const referralCode = "REF" + userId;

          // Save referral code
          db.query(
            "UPDATE users SET referral_code = ? WHERE id = ?",
            [referralCode, userId]
          );

          // Create wallet
          db.query(
            "INSERT INTO wallets (user_id, balance) VALUES (?, 0)",
            [userId]
          );

          // Referral bonus
          if (referral) {
            db.query(
              "SELECT id FROM users WHERE referral_code = ?",
              [referral],
              (err3, refUser) => {
                if (!err3 && refUser.length > 0) {
                  db.query(
                    "UPDATE wallets SET balance = balance + 30 WHERE user_id = ?",
                    [refUser[0].id]
                  );
                }
              }
            );
          }

          res.json({ success:true, message: "User registered successfully" });
        }
      );
    }
  );
});
/* =========================
   LOGIN
========================= */
router.post("/login", (req, res) => {
   console.log("Login requests body:",req.body);
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.json({ message: "All fields required" });
  }

  const sql = "SELECT * FROM users WHERE phone = ?";
  db.query(sql, [phone], (err, users) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (users.length === 0) {
      return res.json({ message: "User not found" });
    }

    if (users[0].password !== password) {
      return res.json({ message: "Wrong password" });
    }

    const userId = users[0].id;

    // 🔵 Fetch wallet balance from wallets table
    db.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [userId],
      (err2, walletRows) => {
        if (err2) return res.status(500).json({ message: "Server error" });

        const balance = walletRows.length > 0 ? walletRows[0].balance : 0;

        res.json({
          message: "Login successful",
          user: {
            id: users[0].id,
            name: users[0].name,
            phone: users[0].phone,
            wallet: balance
          }
        });
      }
    );
  });
});

router.post("/check-user", (req, res) => {
  const { phone } = req.body;

  db.query(
    "SELECT id FROM users WHERE phone=?",
    [phone],
    (err, rows) => {
      if (err || !rows.length)
        return res.json({ success:false, message:"User not found" });

      res.json({ success:true });
    }
  );
});

router.post("/reset-password", (req, res) => {
  const { phone, password } = req.body;

  db.query(
    "UPDATE users SET password=? WHERE phone=?",
    [password, phone],
    (err, result) => {
      if (err || !result.affectedRows) {
        return res.json({ success:false, message:"Error updating password" });
      }

      res.json({ success:true, message:"Password reset successful" });
    }
  );
});

module.exports = router;
