const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL connection
const bcrypt = require("bcryptjs");

// ============================
// Admin Registration
// ============================
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Check if admin already exists
  db.query("SELECT * FROM admins WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });

    if (result.length > 0) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO admins (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err2) => {
          if (err2) return res.status(500).json({ success: false, message: "Registration failed" });

          return res.json({ success: true, message: "Admin registered successfully" });
        }
      );
    } catch (hashErr) {
      return res.status(500).json({ success: false, message: "Server error during hashing" });
    }
  });
});

// ============================
// Admin Login
// ============================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  db.query("SELECT * FROM admins WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const admin = result[0];

    try {
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return res.status(401).json({ success: false, message: "Invalid password" });

      return res.json({
        success: true,
        message: "Login successful",
        admin: { id: admin.id, name: admin.name, email: admin.email }
      });
    } catch (compareErr) {
      return res.status(500).json({ success: false, message: "Server error during password check" });
    }
  });
});

module.exports = router;
