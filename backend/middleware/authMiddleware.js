const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // O token vem no formato: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // armazena os dados do usuário no request
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token inválido ou expirado' });
  }
}

module.exports = verifyToken;
