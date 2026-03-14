const express = require("express");
const router = express.Router();
const db = require("../config/db");
const createNotification = require("../utils/notification"); // ✅ ADD

const multer = require("multer");
const fs = require("fs");
const path = require("path");

// uploads folder create kar do agar exist nahi karta
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

/* =====================================================
   DASHBOARD STATS
===================================================== */
router.get("/stats", (req, res) => {
    const stats = {};

    db.query("SELECT COUNT(*) AS total FROM users", (err, r1) => {
        stats.totalUsers = r1[0].total;

        db.query("SELECT IFNULL(SUM(amount),0) AS total FROM deposits WHERE status='approved'", (err2, r2) => {
            stats.totalDeposits = r2[0].total;

            db.query("SELECT IFNULL(SUM(amount),0) AS total FROM withdrawals WHERE status='approved'", (err3, r3) => {
                stats.totalWithdrawals = r3[0].total;

                db.query("SELECT COUNT(*) AS total FROM challenges", (err4, r4) => {
                    stats.activeChallenges = r4[0].total;
                    res.json(stats);
                });
            });
        });
    });
});

/* =====================================================
   USERS
===================================================== */
router.get("/users", (req, res) => {
    db.query(`SELECT id, name, phone, wallet, created_at FROM users ORDER BY created_at DESC`,
        (err, result) => res.json({ users: result })
    );
});

/* =====================================================
   CHALLENGES LIST
===================================================== */
router.get("/challenges", (req, res) => {
  db.query(`
    SELECT 
      c.id,
      u1.name AS creator,
      u2.name AS joiner,
      c.amount,
      c.status,
      c.game_code
    FROM challenges c
    LEFT JOIN users u1 ON c.creator_id = u1.id
    LEFT JOIN users u2 ON c.joiner_id = u2.id
    ORDER BY c.id DESC
  `, (err, result) => {
    if(err) return res.status(500).json({ error: err });

    res.json({ challenges: result });   // ⭐ FIX
  });
});


/* =====================================================
   CHALLENGE RESULTS LIST
===================================================== */
router.get("/challenge-results", (req, res) => {
  db.query(`
    SELECT 
      cr.challenge_id,
      cr.user_id,
      u.name,
      u.wallet,
      c.amount,
      c.game_code,
      cr.result,
      cr.status,
      cr.screenshot
    FROM challenge_results cr
    JOIN users u ON cr.user_id = u.id
    JOIN challenges c ON cr.challenge_id = c.id
    ORDER BY cr.id DESC
  `, (err, result) => {
    if(err) return res.status(500).json({ error: err });

    res.json({ results: result });   // ⭐ FIX
  });
});

/* =====================================================
   CHALLENGE RESULT VERIFY
===================================================== */
router.post("/challenge-results/verify", (req, res) => {
  const { challenge_id, user_id, action, result_amount } = req.body;

  const status = action === 'approve' ? 'approved' : 'rejected';

  db.query(
    `UPDATE challenge_results SET status=? WHERE challenge_id=? AND user_id=?`,
    [status, challenge_id, user_id],
    (err) => {

      if(action==='approve'){
        db.query(
          `UPDATE users SET wallet = wallet + ? WHERE id=?`,
          [result_amount, user_id],
          ()=>{

            createNotification({
              user_id:user_id,
              message:"Your challenge result approved"
            });

            res.json({message:"Result approved"});
          }
        );
      }else{
        createNotification({
          user_id:user_id,
          message:"Your challenge result rejected"
        });
        res.json({message:"Result rejected"});
      }
    }
  );
});

/* =====================================================
   DEPOSITS
===================================================== */
router.get("/deposits", (req, res) => {
  db.query(`
    SELECT d.id,d.user_id,u.name,u.phone,d.amount,d.screenshot,d.status,d.created_at
    FROM deposits d JOIN users u ON d.user_id=u.id ORDER BY d.created_at DESC`,
    (err, result) => res.json({ deposits: result })
  );
});

router.post("/deposit/approve/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM deposits WHERE id=?", [id], (err, rows) => {
    const deposit = rows[0];

    db.query("UPDATE deposits SET status='approved' WHERE id=?", [id], ()=>{
      db.query("UPDATE users SET wallet = wallet + ? WHERE id=?", [deposit.amount, deposit.user_id], ()=>{

        createNotification({
          user_id:deposit.user_id,
          message:"Your deposit approved"
        });

        res.json({success:true});
      });
    });
  });
});

router.post("/deposit/reject/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT user_id FROM deposits WHERE id=?", [id], (e,r)=>{
    if(r.length){
      createNotification({
        user_id:r[0].user_id,
        message:"Your deposit rejected"
      });
    }
  });

  db.query("UPDATE deposits SET status='rejected' WHERE id=?", [id], ()=> res.json({success:true}));
});
/* =====================================================
   USER DEPOSIT CREATE (UPLOAD SCREENSHOT)
===================================================== */
router.post("/deposit", upload.single("screenshot"), (req, res) => {
  const { user_id, amount } = req.body;
  const screenshot = req.file ? req.file.filename : null;

  if (!user_id || !amount) {
    return res.json({ success:false, message:"All fields required" });
  }

  db.query(
    "INSERT INTO deposits (user_id, amount, screenshot, status) VALUES (?, ?, ?, 'pending')",
    [user_id, amount, screenshot],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success:false, message:"Server error" });
      }

      // 🔔 Admin notification
      createNotification({
        admin:1,
        message:"New deposit request received"
      });

      res.json({ success:true, message:"Deposit request submitted" });
    }
  );
});

/* =====================================================
   UPLOAD DEPOSIT QR (ADMIN)
===================================================== */
router.post("/upload-qr", upload.single("qr"), (req, res) => {

  if (!req.file) {
    return res.json({ success:false, message:"No file uploaded" });
  }

  const filename = req.file.filename;

  // old QR delete + new save
  db.query("DELETE FROM deposit_qr", () => {

    db.query(
      "INSERT INTO deposit_qr (qr_image) VALUES (?)",
      [filename],
      (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ success:false, message:"DB error" });
        }

        res.json({ success:true, message:"QR uploaded successfully" });
      }
    );

  });

});

/* =====================================================
   WITHDRAWALS
===================================================== */
router.get("/withdrawals", (req, res) => {
  db.query(`
    SELECT w.id,u.id user_id,u.name,u.phone,w.amount,u.wallet,w.qr_image,w.status
    FROM withdrawals w JOIN users u ON w.user_id=u.id ORDER BY w.id DESC`,
    (err, result) => res.json(result)
  );
});

router.post("/withdrawals/approve/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM withdrawals WHERE id=?", [id], (err, rows) => {
    const w = rows[0];

    db.query("UPDATE users SET wallet = wallet - ? WHERE id=?", [w.amount, w.user_id], ()=>{
      db.query("UPDATE withdrawals SET status='approved' WHERE id=?", [id], ()=>{

        createNotification({
          user_id:w.user_id,
          message:"Your withdrawal approved"
        });

        res.json({message:"Approved"});
      });
    });
  });
});

router.post("/withdrawals/reject/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT user_id FROM withdrawals WHERE id=?", [id], (e,r)=>{
    if(r.length){
      createNotification({
        user_id:r[0].user_id,
        message:"Your withdrawal rejected"
      });
    }
  });

  db.query("UPDATE withdrawals SET status='rejected' WHERE id=?", [id], ()=> res.json({message:"Rejected"}));
});

/* =====================================================
   HELP REQUESTS
===================================================== */
router.get("/help-requests", (req, res) => {
  db.query("SELECT * FROM help_requests ORDER BY id DESC",
    (err, result) => res.json({ requests: result })
  );
});

router.post("/help-request/resolve", (req, res) => {
  const { id } = req.body;

  db.query("SELECT user_id FROM help_requests WHERE id=?", [id], (e,r)=>{
    if(r.length){
      createNotification({
        user_id:r[0].user_id,
        message:"Your help request resolved"
      });
    }
  });

  db.query("UPDATE help_requests SET status='resolved' WHERE id=?", [id],
    ()=> res.json({message:"Resolved"})
  );
});

/* =====================================================
   ADMIN NOTIFICATIONS
===================================================== */
router.get("/notifications", (req, res) => {
  db.query("SELECT * FROM notifications WHERE admin=1 ORDER BY id DESC",
    (err, result) => res.json({ notifications: result })
  );
});

router.get("/notifications/count", (req, res) => {
  db.query("SELECT COUNT(*) count FROM notifications WHERE admin=1 AND status='unread'",
    (err, result) => res.json({ count: result[0].count })
  );
});

module.exports = router;
