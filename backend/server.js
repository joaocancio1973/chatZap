// backend/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const pool = require('./database.js');
const authenticate = require('./middlewares/auth');
const cors = require('cors');
const authRouter = require('./auth');
const fs = require('fs'); // ← Novo require

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files

// Routes
app.use('/auth', authRouter);

// Serve frontend at root
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Protected API routes
app.use('/api/contacts', authenticate);

// CRUD endpoints
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const [result] = await pool.query(
      'INSERT INTO contacts (name, phone) VALUES (?, ?)',
      [name, phone]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contacts');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    await pool.query(
      'UPDATE contacts SET name = ?, phone = ? WHERE id = ?',
      [name, phone, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5001; // Changed to match your 5001 port
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend accessible at http://localhost:${PORT}`);
});