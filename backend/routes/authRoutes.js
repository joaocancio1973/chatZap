const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');

// POST /auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // 1. Busca usuário
        const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (!user.length) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        // 2. Compara senhas
        const validPassword = await bcrypt.compare(password, user[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        // 3. Salva na sessão (ESSENCIAL)
        req.session.userId = user[0].user_id;
        console.log('Login bem-sucedido para user_id:', user[0].user_id);

        res.json({ 
            success: true,
            user: { id: user[0].user_id, username: user[0].username }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: "Erro interno" });
    }
});

module.exports = router;