const express = require("express");
const router = express.Router();
const db = require("../config/db");
const admin = require("firebase-admin");

/* ✅ SAVE TOKEN */
router.post("/save-token", (req,res)=>{
  const { user_id, token } = req.body;

  db.query(
    "UPDATE users SET fcm_token=? WHERE id=?",
    [token, user_id],
    (err)=>{
      if(err) return res.status(500).json({message:"DB error"});
      res.json({message:"Token saved"});
    }
  );
});

/* GET COUNT (UNREAD) */
router.get("/count/:userId", (req,res)=>{
  const {userId} = req.params;

  db.query(
    "SELECT COUNT(*) as total FROM notifications WHERE user_id=? AND status='unread'",
    [userId],
    (err,result)=>{
      if(err) return res.status(500).json({message:"DB error"});
      res.json({count: result[0].total});
    }
  );
});

/* GET USER NOTIFICATIONS */
router.get("/:userId", (req,res)=>{
  const {userId} = req.params;

  db.query(
    "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC",
    [userId],
    (err,result)=>{
      if(err) return res.status(500).json({message:"DB error"});
      res.json({notifications: result});
    }
  );
});

/* MARK AS READ */
router.post("/read/:id",(req,res)=>{
  db.query(
    "UPDATE notifications SET status='read' WHERE id=?",
    [req.params.id],
    ()=> res.json({message:"Read"})
  );
});

/* 🔥 SEND PUSH NOTIFICATION */
router.post("/send", async (req, res) => {
  try {
    const { token, title, body } = req.body;

    const message = {
      notification: {
        title: title,
        body: body
      },
      token: token
    };

    const response = await admin.messaging().send(message);

    res.json({
      success: true,
      response
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Notification failed"
    });
  }
});

module.exports = router;
