const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ENTRIES_FILE = path.join(__dirname, 'journalEntries.json');
const FAVORITES_FILE = path.join(__dirname, 'favorites.json');

// Multer setup for photo uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper to read entries from file
function readEntries() {
  try {
    const data = fs.readFileSync(ENTRIES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper to write entries to file
function writeEntries(entries) {
  fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2));
}

// Helper to read favorites from file
function readFavorites() {
  try {
    const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper to write favorites to file
function writeFavorites(favorites) {
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
}

// Get all entries
app.get('/entries', (req, res) => {
  const entries = readEntries();
  res.json(entries);
});

// Add new entry
app.post('/entries', upload.single('photo'), (req, res) => {
  const { date, text } = req.body;
  let photo = null;
  if (req.file) {
    photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }
  const entries = readEntries();
  const newEntry = { id: Date.now(), date, text, photo };
  entries.push(newEntry);
  writeEntries(entries);
  res.status(201).json(newEntry);
});

// Delete entry by id
app.delete('/entries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let entries = readEntries();
  entries = entries.filter(entry => entry.id !== id);
  writeEntries(entries);
  res.status(204).send();
});

// Get all favorites
app.get('/favorites', (req, res) => {
  const favorites = readFavorites();
  res.json(favorites);
});

// Add new favorite
app.post('/favorites', upload.single('photo'), (req, res) => {
  const { category, description } = req.body;
  let photo = null;
  if (req.file) {
    photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }
  const favorites = readFavorites();
  const newFavorite = { id: Date.now(), category, description, photo };
  favorites.push(newFavorite);
  writeFavorites(favorites);
  res.status(201).json(newFavorite);
});

// Delete favorite by id
app.delete('/favorites/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let favorites = readFavorites();
  favorites = favorites.filter(fav => fav.id !== id);
  writeFavorites(favorites);
  res.status(204).send();
});

// Update entry by id
app.put('/entries/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updatedData = req.body;
  let entries = readEntries();
  const index = entries.findIndex(entry => entry.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  entries[index] = { ...entries[index], ...updatedData };
  writeEntries(entries);
  res.json(entries[index]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
