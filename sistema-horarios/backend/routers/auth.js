const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const bcrypt = require('bcrypt'); // 🔹 Alterado de bcryptjs para bcrypt
require('dotenv').config();

// 🔹 Rota de Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT u.id, u.nome, u.email, u.password_hash, t.tipoutilizador
       FROM utilizador u
       LEFT JOIN tipoutilizador t ON u.tipo_funcionario_id = t.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Utilizador não encontrado' });
    }

    const user = result.rows[0];

    // 🔹 Debug - mostrar o que está a ser comparado (opcional)
    console.log('Senha digitada:', password);
    console.log('Hash no banco:', user.password_hash);

    // 🔹 Verificação da senha usando bcrypt
    const senhaCorreta = await bcrypt.compare(password, user.password_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipoutilizador,
      },
      process.env.JWT_SECRET || 'segredo_temporario',
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login bem-sucedido',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipoutilizador,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
