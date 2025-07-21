const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./database');

// @desc    Login do usuário
// @route   POST /auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 1. Validação simples (pode usar bibliotecas como 'joi' ou 'express-validator')
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  try {
    // 2. Busca usuário no banco
    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (user.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' }); // Evita dar pistas sobre usuários existentes
    }

    // 3. Compara senhas (com bcrypt)
    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // 4. Gera token JWT (com dados mínimos necessários)
    const token = jwt.sign(
      { userId: user[0].user_id }, // Usando 'user_id' do seu banco
      process.env.JWT_SECRET || 'seu_secret_fallback', // Fallback para desenvolvimento
      { expiresIn: '1h' }
    );

    // 5. Resposta (evita enviar dados sensíveis)
    res.json({ 
      token,
      user: { id: user[0].user_id, username: user[0].username } // Dados úteis para o frontend
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// @desc    Registro de novo usuário
// @route   POST /auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  try {
    // Verifica se usuário já existe
    const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Usuário já existe' }); // 409 = Conflict
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere novo usuário
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    // Gera token automaticamente após registro (opcional)
    const token = jwt.sign(
      { userId: result.insertId }, // Pega o ID do novo usuário
      process.env.JWT_SECRET || 'seu_secret_fallback',
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      token,
      user: { id: result.insertId, username }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;