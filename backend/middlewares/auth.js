// auth.js - Roteador de Autenticação
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database'); // Ajuste o caminho conforme sua estrutura

// =============================================
// 1. ROTA DE LOGIN (POST)
// =============================================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validação básica
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Usuário e senha são obrigatórios!' 
    });
  }

  try {
    // Verifica se o usuário existe
    const [user] = await pool.query(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );

    if (user.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciais inválidas!' 
      });
    }

    // Compara a senha com bcrypt
    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciais inválidas!' 
      });
    }

    // Salva o user_id na sessão (CRUCIAL para seu problema!)
    req.session.userId = user[0].user_id;

    // Resposta de sucesso
    res.json({ 
      success: true,
      user: { id: user[0].user_id, username: user[0].username }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno no servidor.' 
    });
  }
});

// =============================================
// 2. ROTA DE REGISTRO (POST - OPCIONAL)
// =============================================
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Usuário e senha são obrigatórios!' 
    });
  }

  try {
    // Verifica se o usuário já existe
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Este usuário já existe!' 
      });
    }

    // Cria hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere no banco
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, hashedPassword]
    );

    // Automaticamente loga o usuário após o registro (opcional)
    req.session.userId = result.insertId;

    res.status(201).json({ 
      success: true,
      user: { id: result.insertId, username }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno no servidor.' 
    });
  }
});

module.exports = (req, res, next) => {
  if (!req.session.userId) {
      console.log('Acesso negado - userId não encontrado na sessão');
      return res.status(401).json({ error: "Faça login primeiro!" });
  }
  next();
};