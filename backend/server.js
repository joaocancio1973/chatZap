// server.js - Versão Consolidada e Segura
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const pool = require('./database.js');
const authenticate = require('./middlewares/auth');
const cors = require('cors');
const authRouter = require('./routes/authRoutes.js');

// =============================================
// 1. CONFIGURAÇÃO INICIAL (Middlewares Globais)
// =============================================
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5001'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// =============================================
// 2. SESSÃO SEGURA (Login Persistente)
// =============================================
app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo-super-secreto-123', // Altere no .env!
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // HTTPS em produção
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        name: 'chatZap.sid' // Nome personalizado
    }
}));

// =============================================
// 3. ROTAS PRINCIPAIS
// =============================================

// (A) Rotas Públicas
app.use('/auth', authRouter); // Login/Registro

// (B) Rota de Logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro no logout:', err);
            return res.status(500).json({ success: false, error: 'Erro ao fazer logout' });
        }
        res.clearCookie('chatZap.sid')
          .json({ success: true, message: 'Logout realizado!' });
    });
});

// (C) Rotas Protegidas (requerem login)
app.use('/api/contacts', authenticate); // <<< Middleware de autenticação

// (D) CRUD de Contatos (SUA LÓGICA ORIGINAL - PRESERVADA)
app.post('/api/contacts', async (req, res) => {
    try {
      const { name, phone } = req.body;
      
      // LINHA ADICIONADA: Pega o ID do usuário logado
      const userId = req.userId || req.session.userId;
      
      console.log("UserID:", userId); // Depuração
  
      const [result] = await pool.query(
        'INSERT INTO contacts (name, phone, user_id) VALUES (?, ?, ?)',
        [name, phone, userId] // Agora com user_id
      );
  
      res.status(201).json({ 
        success: true,
        id: result.insertId,
        user_id: userId // Retorna para confirmação
      });
      
    } catch (err) {
      console.error("Erro ao criar contato:", err);
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/contacts', async (req, res) => {
    try {
      const userId = req.userId || req.session.userId;
      
      const [rows] = await pool.query(
        'SELECT * FROM contacts WHERE user_id = ?', 
        [userId]
      );
      
      res.json({ 
        success: true,
        contacts: rows 
      });
      
    } catch (err) {
      console.error("Erro ao buscar contatos:", err);
      res.status(500).json({ error: "Erro interno" });
    }
  });

app.put('/api/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;
        const [result] = await pool.query(
            'UPDATE contacts SET name = ?, phone = ? WHERE id = ? AND user_id = ?',
            [name, phone, id, req.session.userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Contato não encontrado' 
            });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao atualizar contato:', err);
        res.status(400).json({ success: false, error: err.message });
    }
});

app.delete('/api/contacts/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM contacts WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Contato não encontrado' 
            });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao deletar contato:', err);
        res.status(500).json({ success: false, error: 'Erro interno' });
    }
});

// =============================================
// 4. ROTAS AUXILIARES
// =============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'online', 
        session: req.session.userId ? 'active' : 'inactive' 
    });
});

// =============================================
// 5. WEBSOCKETS (Socket.io - Configuração Original)
// =============================================
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// =============================================
// 6. INICIALIZAÇÃO DO SERVIDOR
// =============================================
const PORT = process.env.PORT || 5001;
http.listen(PORT, () => {
    console.log(`🟢 Servidor rodando na porta ${PORT}`);
    console.log(`🔐 Modo de segurança: ${process.env.NODE_ENV === 'production' ? 'ATIVADO' : 'DESATIVADO'}`);
});