const pool = require('./db');
const bcrypt = require('bcrypt'); // 🔹 usar bcrypt, não bcryptjs

async function hashSenhas() {
  try {
    // Obter todos os utilizadores
    const result = await pool.query('SELECT id, nome FROM utilizador');
    const usuarios = result.rows;

    for (const u of usuarios) {
      const senhaClara = '1234'; // 🔹 define a senha de teste para todos
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senhaClara, salt);

      await pool.query(
        'UPDATE utilizador SET password_hash = $1 WHERE id = $2',
        [hashedPassword, u.id]
      );
      console.log(`Senha do utilizador ${u.nome} atualizada para '${senhaClara}'.`);
    }

    console.log('✅ Todas as senhas foram atualizadas para hash com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao atualizar senhas:', err);
    process.exit(1);
  }
}

hashSenhas();
