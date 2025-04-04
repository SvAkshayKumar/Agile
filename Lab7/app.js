const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');

const app = express();
const port = 3000;

// SQLite database setup
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
    db.run(`CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_data BLOB NOT NULL
    )`);
  }
});

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Image Upload API!');
});

// Endpoint to upload image
app.post('/upload', upload.single('image'), (req, res) => {
  const image = req.file.buffer; // Image file as buffer

  db.run('INSERT INTO images (image_data) VALUES (?)', [image], function (err) {
    if (err) {
      console.error('Error inserting image:', err);
      res.status(500).send('Error uploading image');
    } else {
      res.send(`Image uploaded successfully with ID: ${this.lastID}`);
    }
  });
});

// Endpoint to retrieve image
app.get('/image/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT image_data FROM images WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching image:', err);
      res.status(500).send('Error retrieving image');
    } else if (!row) {
      res.status(404).send('Image not found');
    } else {
      res.contentType('image/jpeg');
      res.send(row.image_data);
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});