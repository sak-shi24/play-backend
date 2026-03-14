const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection on startup
db.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    process.exit(1); // Crash fast so Render shows the error clearly
  } else {
    console.log("MySQL Connected");
    connection.release();
  }
});

module.exports = db;
