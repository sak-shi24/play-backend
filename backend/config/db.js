const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root123",
  database: "play",
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("MySQL Connected");
  }
});

module.exports = db;
