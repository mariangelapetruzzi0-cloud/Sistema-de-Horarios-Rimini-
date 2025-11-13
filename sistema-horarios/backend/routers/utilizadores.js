const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs'); // 🔹 Import bcrypt

// 🔹 GET /api/utilizadores — listar todos os utilizadores (sem token)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nome, u.email, u.loja, t.tipoutilizador AS tipo_utilizador
      FROM utilizador u
      LEFT JOIN tipoutilizador t ON u.tipo_funcionario_id = t.id
      ORDER BY u.id ASC
    `);

    const usuariosComSenhaOculta = result.rows.map(u => ({
      ...u,
      password: '******'
    }));

    res.json(usuariosComSenhaOculta);
  } catch (err) {
    console.error('Erro ao buscar utilizadores:', err.message);
    res.status(500).json({ error: 'Erro ao buscar utilizadores' });
  }
});

// 🔹 POST /api/utilizadores — criar novo utilizador
router.post('/', async (req, res) => {
  const { nome, email, password, loja, tipo_utilizador } = req.body;

  if (!nome || !email || !password || !tipo_utilizador || !loja) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const tipoResult = await pool.query(
      'SELECT id FROM tipoutilizador WHERE tipoutilizador = $1',
      [tipo_utilizador]
    );
    const tipoId = tipoResult.rows[0]?.id;
    if (!tipoId) return res.status(400).json({ error: 'Tipo de utilizador inválido' });

    // 🔹 Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await pool.query(
      'INSERT INTO utilizador (nome, email, password_hash, loja, tipo_funcionario_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nome, email, hashedPassword, loja, tipoId]
    );

    const novoId = insertResult.rows[0]?.id;
    const novoUtilizador = await pool.query(
      `SELECT u.id, u.nome, u.email, u.loja, t.tipoutilizador AS tipo_utilizador
       FROM utilizador u
       LEFT JOIN tipoutilizador t ON u.tipo_funcionario_id = t.id
       WHERE u.id = $1`,
      [novoId]
    );

    res.status(201).json({ ...novoUtilizador.rows[0], password: '******' });
  } catch (err) {
    console.error('Erro ao criar utilizador:', err.message);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Nome ou email já existente' });
    } else {
      res.status(500).json({ error: 'Erro ao criar utilizador' });
    }
  }
});

// 🔹 PUT /api/utilizadores/:id — atualizar utilizador
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { nome, email, password, loja, tipo_utilizador } = req.body;

  if (!nome || !email || !password || !tipo_utilizador || !loja) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const tipoResult = await pool.query(
      'SELECT id FROM tipoutilizador WHERE tipoutilizador = $1',
      [tipo_utilizador]
    );
    const tipoId = tipoResult.rows[0]?.id;
    if (!tipoId) return res.status(400).json({ error: 'Tipo de utilizador inválido' });

    // 🔹 Hash da senha antes de atualizar
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE utilizador SET nome = $1, email = $2, password_hash = $3, loja = $4, tipo_funcionario_id = $5 WHERE id = $6',
      [nome, email, hashedPassword, loja, tipoId, id]
    );

    const atualizado = await pool.query(`
      SELECT u.id, u.nome, u.email, u.loja, t.tipoutilizador AS tipo_utilizador
      FROM utilizador u
      LEFT JOIN tipoutilizador t ON u.tipo_funcionario_id = t.id
      WHERE u.id = $1
    `, [id]);

    res.json({ ...atualizado.rows[0], password: '******' });
  } catch (err) {
    console.error('Erro ao atualizar utilizador:', err.message);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Nome ou email já existente' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar utilizador' });
    }
  }
});

// 🔹 DELETE /api/utilizadores/:id — eliminar utilizador
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await pool.query('SELECT tipo_funcionario_id FROM utilizador WHERE id = $1', [id]);
    const tipoId = userResult.rows[0]?.tipo_funcionario_id;
    if (!tipoId) return res.status(404).json({ error: 'Utilizador não encontrado' });

    if (tipoId === 1) {
      const adminCountResult = await pool.query('SELECT COUNT(*) FROM utilizador WHERE tipo_funcionario_id = 1');
      const adminCount = parseInt(adminCountResult.rows[0].count, 10);

      if (adminCount <= 1) {
        return res.status(403).json({ error: 'Não é possível eliminar o último administrador' });
      }
    }

    await pool.query('DELETE FROM utilizador WHERE id = $1', [id]);
    res.json({ message: 'Utilizador eliminado com sucesso' });
  } catch (err) {
    console.error('Erro ao eliminar utilizador:', err.message);
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
});

module.exports = router;
