const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const cors = require("cors");
const db = require("./database");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// Image Upload Configuration
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

// **User Registration**
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, password],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ userId: this.lastID });
    }
  );
});

// **User Login**
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT id FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err || !row) return res.status(400).json({ error: "Invalid credentials" });
    res.json({ userId: row.id });
  });
});

// **Send Message**
io.on("connection", (socket) => {
  socket.on("sendMessage", ({ sender_id, receiver_id, message }) => {
    db.run(
      "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [sender_id, receiver_id, message],
      function (err) {
        if (!err) {
          io.emit(`message-${receiver_id}`, { sender_id, message });
        }
      }
    );
  });

  socket.on("sendImage", ({ sender_id, receiver_id, imageUrl }) => {
    db.run(
      "INSERT INTO messages (sender_id, receiver_id, image) VALUES (?, ?, ?)",
      [sender_id, receiver_id, imageUrl],
      function (err) {
        if (!err) {
          io.emit(`message-${receiver_id}`, { sender_id, image: imageUrl });
        }
      }
    );
  });
});

// **Upload Image**
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
