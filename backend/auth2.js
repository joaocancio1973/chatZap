const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./database');

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Verifica se usuário existe
    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!user.length) return res.status(401).json({ error: 'Credenciais inválidas' });

    // 2. Compara senhas
    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas' });

    // 3. Gera token JWT
    const token = jwt.sign(
      { userId: user[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Registro (opcional)
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Usuário já existe' });
  }
});

module.exports = router;