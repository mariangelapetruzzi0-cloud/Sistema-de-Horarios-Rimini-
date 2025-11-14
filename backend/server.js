require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const app = express();
const port = process.env.PORT || 5000; // alterado para 5000 (para alinhar com o frontend)

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 🔹 Rotas específicas (mantendo o padrão /api/...)
const authRoutes = require('./routers/auth');
app.use('/api/auth', authRoutes);

const horariosRoutes = require('./routers/horarios');
app.use('/api/horarios', horariosRoutes);

const uploadRoutes = require('./routers/upload');
app.use('/api/upload', uploadRoutes);

// 🔹 Nova rota de utilizadores
const utilizadoresRoutes = require('./routers/utilizadores');
app.use('/api/utilizadores', utilizadoresRoutes);

// Rota básica de teste
app.get('/', (req, res) => {
  res.send('✅ Backend está funcionando!');
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
