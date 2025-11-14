const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../middleware/authMiddleware'); // opcional

const router = express.Router();

// Criar pasta uploads se não existir
const uploadFolder = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Configuração do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Endpoint POST /api/upload — opcionalmente protegido
router.post('/', verifyToken, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma foto enviada' });

  // Retornar URL completo do arquivo
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
