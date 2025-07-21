const jwt = require('jsonwebtoken');

// Middleware de autenticação (PROTEÇÃO DAS ROTAS)
function authenticate(req, res, next) {
  // 1. Pega o token do cabeçalho da requisição
  const token = req.headers.authorization?.split(' ')[1];
  
  // 2. Se não tiver token, bloqueia
  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado! 🔒' });
  }

  // 3. Verifica se o token é válido
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Salva o ID do usuário na requisição
    next(); // Permite continuar
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado! ⏳' });
  }
}

module.exports = authenticate;