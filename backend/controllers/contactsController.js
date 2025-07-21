import pool from '../database.js'; // Importa a conexão com o MySQL

// Busca contatos do usuário logado
export const getUserContacts = async (req, res) => {
  try {
    const [contacts] = await pool.query(
      'SELECT id, name, phone FROM contacts WHERE user_id = ?',
      [req.userId] // Assume que o middleware auth.js adiciona req.userId
    );
    res.json(contacts);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// (Outras funções do CRUD podem ser adicionadas aqui)