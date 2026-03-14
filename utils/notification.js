const db = require("../config/db");

/* CREATE USER NOTIFICATION */
function createNotification({ user_id = null, admin = null, message }) {

  const sql = `
    INSERT INTO notifications (user_id, admin, message, status, created_at)
    VALUES (?, ?, ?, 'unread', NOW())
  `;

  db.query(sql, [user_id, admin, message], (err) => {
    if (err) console.log("Notification error:", err);
  });

}

module.exports = createNotification;
