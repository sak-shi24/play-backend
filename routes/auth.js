const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");

/* =========================
   REGISTER
========================= */

router.post("/register", async (req,res)=>{

  const { name,email,phone,password,referral } = req.body;

  if(!name || !email || !phone || !password){
    return res.json({
      success:false,
      message:"All fields required"
    });
  }

  try{

    db.query(
      "SELECT * FROM users WHERE phone=? OR email=?",
      [phone,email],
      async (err,users)=>{

        if(err) return res.status(500).json({success:false,message:"Server error"});

        if(users.length>0){
          return res.json({
            success:false,
            message:"User already exists"
          });
        }

        const hashedPassword = await bcrypt.hash(password,10);

        db.query(
          "INSERT INTO users (name,email,phone,password,referred_by) VALUES (?,?,?,?,?)",
          [name,email,phone,hashedPassword,referral || null],
          (err2,result)=>{

            if(err2){
              console.log(err2);
              return res.status(500).json({success:false,message:"Server error"});
            }

            const userId = result.insertId;
            const referralCode = "REF"+userId;

            db.query(
              "UPDATE users SET referral_code=? WHERE id=?",
              [referralCode,userId]
            );

            db.query(
              "INSERT INTO wallets (user_id,balance) VALUES (?,0)",
              [userId]
            );

            if(referral){
              db.query(
                "SELECT id FROM users WHERE referral_code=?",
                [referral],
                (err3,refUser)=>{

                  if(!err3 && refUser.length>0){

                    db.query(
                      "UPDATE wallets SET balance = balance + 30 WHERE user_id=?",
                      [refUser[0].id]
                    );

                  }

                }
              );
            }

            res.json({
              success:true,
              message:"User registered successfully"
            });

          }
        );

      }
    );

  }catch(error){
    res.status(500).json({success:false,message:"Server error"});
  }

});

/* =========================
   LOGIN
========================= */

router.post("/login",(req,res)=>{

  const { phone,password } = req.body;

  if(!phone || !password){
    return res.json({
      success:false,
      message:"All fields required"
    });
  }

  db.query(
    "SELECT * FROM users WHERE phone=?",
    [phone],
    async (err,users)=>{

      if(err) return res.status(500).json({success:false,message:"Server error"});

      if(users.length===0){
        return res.json({
          success:false,
          message:"User not found"
        });
      }

      const match = await bcrypt.compare(password,users[0].password);

      if(!match){
        return res.json({
          success:false,
          message:"Wrong password"
        });
      }

      const userId = users[0].id;

      db.query(
        "SELECT balance FROM wallets WHERE user_id=?",
        [userId],
        (err2,walletRows)=>{

          if(err2) return res.status(500).json({success:false,message:"Server error"});

          const balance = walletRows.length ? walletRows[0].balance : 0;

          res.json({
            success:true,
            message:"Login successful",
            user:{
              id:users[0].id,
              name:users[0].name,
              phone:users[0].phone,
              wallet:balance
            }
          });

        }
      );

    }
  );

});

/* =========================
   CHECK USER
========================= */

router.post("/check-user",(req,res)=>{

  const { phone } = req.body;

  db.query(
    "SELECT id FROM users WHERE phone=?",
    [phone],
    (err,rows)=>{

      if(err || !rows.length){
        return res.json({
          success:false,
          message:"User not found"
        });
      }

      res.json({success:true});

    }
  );

});

/* =========================
   RESET PASSWORD
========================= */

router.post("/reset-password",(req,res)=>{

  const { phone,password } = req.body;

  bcrypt.hash(password,10,(err,hash)=>{

    db.query(
      "UPDATE users SET password=? WHERE phone=?",
      [hash,phone],
      (err2,result)=>{

        if(err2 || !result.affectedRows){
          return res.json({
            success:false,
            message:"Error updating password"
          });
        }

        res.json({
          success:true,
          message:"Password reset successful"
        });

      }
    );

  });

});

module.exports = router;
