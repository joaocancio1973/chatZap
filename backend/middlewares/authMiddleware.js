const jwt = require('jsonwebtoken');

// Middleware para verificar o token JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Pega o token do header "Authorization"

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    // Verifica o token e decodifica o payload (incluindo userId)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_fallback');
    req.userId = decoded.userId; // Adiciona o userId à requisição
    next(); // Passa para a próxima função (controller)
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authenticate;