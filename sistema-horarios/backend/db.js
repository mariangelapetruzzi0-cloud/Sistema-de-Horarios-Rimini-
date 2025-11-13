require('dotenv').config();
const { Pool } = require('pg');

// Criando a conexão com o banco (Render/Postgres)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // pega a URL completa do Render
  ssl: {
    rejectUnauthorized: false, // necessário para o SSL do Render
  },
});

// Testando a conexão
pool.connect()
  .then(client => {
    console.log('Conectado ao PostgreSQL!');
    client.release();
  })
  .catch(err => {
    console.error('Erro ao conectar ao PostgreSQL', err.stack);
  });

module.exports = pool;
