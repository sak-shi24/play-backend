const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ✅ ADMIN ALL NOTIFICATIONS */
router.get("/", (req,res)=>{
  db.query(
    "SELECT * FROM notifications WHERE admin=1 ORDER BY id DESC",
    (err,result)=>{
      if(err) return res.status(500).json({message:"DB error"});
      res.json({notifications: result});
    }
  );
});

/* ✅ ADMIN COUNT */
router.get("/count", (req,res)=>{
  db.query(
    "SELECT COUNT(*) as count FROM notifications WHERE admin=1 AND is_read=0",
    (err,result)=>{
      if(err){
        console.error("Admin count error:", err);
        return res.status(500).json({message:"DB error"});
      }
      res.json({count: result[0]?.count || 0});
    }
  );
});

/* ✅ MARK READ */
router.post("/read/:id",(req,res)=>{
  db.query(
    "UPDATE notifications SET is_read=1 WHERE id=?",
    [req.params.id],
    ()=> res.json({message:"Read"})
  );
});

module.exports = router;
