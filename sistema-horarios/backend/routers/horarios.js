const express = require('express');
const router = express.Router();
const pool = require('../db');

// 🔹 GET todos horários
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM horarios ORDER BY dia_trabalho ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro no GET /api/horarios:', err);
    res.status(500).json({ error: 'Erro ao buscar horários' });
  }
});

// 🔹 POST novo horário (suporta 1 ou vários)
router.post('/', async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];

    console.log('📥 Dados recebidos:', data);

    const insertedRows = [];

    for (const h of data) {
      const { utilizador_id, dia_trabalho, hora_entrada, hora_saida, loja, semana, utilizador_nome } = h;

      if (!utilizador_nome || !loja || !semana || !dia_trabalho) {
        console.warn('⚠️ Ignorado horário inválido:', h);
        continue;
      }

      const result = await pool.query(
        `INSERT INTO horarios 
          (utilizador_id, dia_trabalho, hora_entrada, hora_saida, loja, semana, utilizador_nome)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [utilizador_id || null, dia_trabalho, hora_entrada, hora_saida, loja, semana, utilizador_nome]
      );

      insertedRows.push(result.rows[0]);
    }

    if (insertedRows.length === 0) {
      return res.status(400).json({ error: 'Nenhum horário válido inserido' });
    }

    res.status(201).json({ message: 'Horários inseridos com sucesso', data: insertedRows });
  } catch (err) {
    console.error('❌ Erro no POST /api/horarios:', err);
    res.status(500).json({ error: 'Erro ao criar horário' });
  }
});

// 🔹 PUT para editar horários existentes
router.put('/editar', async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];

    for (const h of data) {
      const { id, hora_entrada, hora_saida } = h;
      if (!id) continue;

      await pool.query(
        `UPDATE horarios
         SET hora_entrada = $1, hora_saida = $2
         WHERE id = $3`,
        [hora_entrada, hora_saida, id]
      );
    }

    res.json({ message: 'Horários atualizados com sucesso' });
  } catch (err) {
    console.error('❌ Erro no PUT /api/horarios/editar:', err);
    res.status(500).json({ error: 'Erro ao atualizar horários' });
  }
});

// 🔹 DELETE para eliminar um horário pelo ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM horarios WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Horário não encontrado' });
    }
    res.json({ message: 'Horário eliminado com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao eliminar horário:', err);
    res.status(500).json({ message: 'Erro ao eliminar horário' });
  }
});

module.exports = router;
