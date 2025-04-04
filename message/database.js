const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./chat.db", (err) => {
  if (err) console.error("Database Connection Error:", err);
  else console.log("Connected to SQLite Database.");
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      username TEXT UNIQUE, 
      password TEXT
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      sender_id INTEGER, 
      receiver_id INTEGER, 
      message TEXT, 
      image TEXT, 
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
});

module.exports = db;
