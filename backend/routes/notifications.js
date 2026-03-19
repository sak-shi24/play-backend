const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* GET USER NOTIFICATIONS */
router.get("/:userId", (req,res)=>{
  const {userId} = req.params;

  db.query(
    "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC",
    [userId],
    (err,result)=>{
      if(err) return res.status(500).json({message:"DB error"});
      res.json({notifications: result});   // ✅ important fix
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
      res.json({count: result[0].total});   // ✅ important fix
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

module.exports = router;
