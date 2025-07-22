const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');

router.post('/register-temp', express.json(), async (req, res) => {
    console.log("Dados recebidos:", req.body);
    
    try {
        const { username, password } = req.body;

        // 1. Validação básica
        if (!username || !password) {
            return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
        }

        // 2. Verifica se usuário existe
        const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (user.length > 0) {
            return res.status(409).json({ error: "Usuário já existe" });
        }

        // 3. Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Senha hasheada:", hashedPassword);

        // 4. Insere no banco
        const [result] = await pool.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        console.log("Resultado da inserção:", result);

        // 5. Retorna sucesso
        res.status(201).json({
            success: true,
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Erro durante registro:", error);
        res.status(500).json({ 
            error: "Erro no servidor",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
module.exports = router;