const express = require("express");
const router = express.Router();
const db = require("../config/db");

const multer = require("multer");
const path = require("path");

/* ✅ ADD NOTIFICATION IMPORT */
const createNotification = require("../utils/notification");

/* MULTER CONFIG */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

/* CREATE CHALLENGE */
router.post("/create", (req, res) => {
  const { creator_id, amount } = req.body;

  if (!creator_id || !amount) {
    return res.status(400).json({ message: "Missing data" });
  }

  db.query(
    "SELECT wallet FROM users WHERE id=?",
    [creator_id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Server error" });

      if (rows.length === 0)
        return res.status(400).json({ message: "User not found" });

      if (rows[0].wallet < amount) {
        return res.status(400).json({
          message: "You do not have sufficient amount in wallet"
        });
      }

      const sql =
        "INSERT INTO challenges (creator_id, amount, status) VALUES (?, ?, 'open')";

      db.query(sql, [creator_id, amount], (err2, result) => {
        if (err2) return res.status(500).json({ message: "Server error" });

        res.json({
          message: "Challenge created successfully",
          challenge_id: result.insertId,
        });
      });
    }
  );
});

/* CREATE ROOM */
router.post("/create-room", (req, res) => {
  const { challenge_id, game_code } = req.body;

  if (!/^\d{8}$/.test(game_code)) {
    return res.json({ message: "Room code must be exactly 8 digits" });
  }

  const sql = `
    UPDATE challenges
    SET game_code=?, status='room_created'
    WHERE id=? AND game_code IS NULL
  `;

  db.query(sql, [game_code, challenge_id], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.json({
        message: "Opponent is creating room, you have to join the room"
      });
    }

    res.json({ message: "Room created successfully" });
  });
});

/* LIST CHALLENGES */
router.get("/list/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT *
    FROM challenges
    WHERE status IN ('open', 'room_created')
       OR creator_id=?
       OR joiner_id=?
    ORDER BY id DESC
  `;

  db.query(sql, [userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error" });
    res.json(rows);
  });
});

/* ACCEPT CHALLENGE */
router.post("/accept", (req, res) => {
  const { challenge_id, user_id } = req.body;

  db.query(
    "SELECT amount, creator_id FROM challenges WHERE id=? AND status='open'",
    [challenge_id],
    (err, rows) => {

      if (err)
        return res.status(500).json({ success:false, message: "Server error" });

      if (rows.length === 0)
        return res.json({ success:false, message: "Challenge not available" });

      const challengeAmount = rows[0].amount;
      const creator_id = rows[0].creator_id; // ✅ FIX

      db.query(
        "SELECT wallet FROM users WHERE id=?",
        [user_id],
        (err2, userRows) => {

          if (err2)
            return res.status(500).json({ success:false, message: "Server error" });

          if (userRows[0].wallet < challengeAmount) {
            return res.status(400).json({
              success:false,
              message: "You do not have sufficient amount in wallet"
            });
          }

          const sql = `
            UPDATE challenges
            SET joiner_id=?, status='joined'
            WHERE id=? AND status='open' AND creator_id!=?
          `;

          db.query(sql, [user_id, challenge_id, user_id], (err3, result) => {

            if (err3)
              return res.status(500).json({ success:false, message: "Server error" });

            if (result.affectedRows === 0) {
              return res.json({ success:false, message: "Cannot accept" });
            }

            /* ✅ NOTIFICATION AFTER SUCCESS */
            createNotification({
              user_id: creator_id,
              message: "Your challenge has been accepted"
            });

            res.json({
              success:true,
              message: "Challenge accepted",
              challenge_id: challenge_id
            });

          });
        }
      );
    }
  );
});

/* GET ROOM CODE */
router.get("/room-code/:id", (req, res) => {
  db.query(
    "SELECT game_code FROM challenges WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Server error" });
      res.json({ game_code: rows[0]?.game_code || null });
    }
  );
});

/* SUBMIT RESULT */
router.post("/submit-result", upload.single("screenshot"), (req, res) => {
  const { challenge_id, user_id, result } = req.body;

  if (!req.file) return res.json({ message: "Screenshot required" });

  const screenshotPath = req.file.filename;

  const checkSql =
    "SELECT id FROM challenge_results WHERE challenge_id=? AND user_id=?";
  db.query(checkSql, [challenge_id, user_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (rows.length > 0) return res.json({ message: "Already submitted" });

    const insertSql = `
      INSERT INTO challenge_results
      (challenge_id, user_id, result, screenshot, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(
      insertSql,
      [challenge_id, user_id, result, screenshotPath],
      (err2) => {
        if (err2) return res.status(500).json({ message: "Server error" });

        /* ✅ NOTIFICATION AFTER SUCCESS */
        createNotification({
          admin: 1,
          message: "New challenge result submitted"
        });

        const getResults =
          "SELECT result FROM challenge_results WHERE challenge_id=?";
        
        db.query(getResults, [challenge_id], (err3, results) => {
          if (err3) return res.json({ message: "Result submitted successfully" });

          if (results.length < 2) {
            return res.json({ message: "Result submitted, waiting opponent" });
          }

          const r1 = results[0].result;
          const r2 = results[1].result;

          if (
            (r1 === "win" && r2 === "win") ||
            (r1 === "loss" && r2 === "loss")
          ) {
            db.query(
              "UPDATE challenges SET status='conflict' WHERE id=?",
              [challenge_id]
            );
            return res.json({ message: "Conflict detected" });
          }

          db.query(
            "UPDATE challenges SET status='win_claimed' WHERE id=?",
            [challenge_id]
          );

          res.json({ message: "Results submitted, waiting admin approval" });
        });
      }
    );
  });
});

module.exports = router;
