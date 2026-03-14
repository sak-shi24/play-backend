const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* GET COUNT (UNREAD)
   IMPORTANT: Must be defined BEFORE /:userId
   Otherwise Express matches "count" as a userId param */
router.get("/count/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    "SELECT COUNT(*) as total FROM notifications WHERE user_id=? AND status='unread'",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ count: result[0].total });
    }
  );
});

/* GET USER NOTIFICATIONS */
router.get("/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ notifications: result });
    }
  );
});

/* MARK AS READ */
router.post("/read/:id", (req, res) => {
  db.query(
    "UPDATE notifications SET status='read' WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ message: "Read" });
    }
  );
});

module.exports = router;
