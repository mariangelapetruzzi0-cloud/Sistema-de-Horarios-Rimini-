require('dotenv').config();
const { Pool } = require('pg');

// Criando a conexão com o banco
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
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
