const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Multer storage configuration for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// File upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype
  });
});

// Users
router.get('/users', (req, res) => {
  res.json(db.getUsers());
});

router.get('/users/:id', (req, res) => {
  const user = db.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

router.patch('/users/:id', (req, res) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(updated);
});

// Servers
router.get('/servers', (req, res) => {
  const { userId } = req.query;
  if (userId) {
    return res.json(db.getUserServers(userId));
  }
  res.json(db.getServers());
});

router.post('/servers', (req, res) => {
  const { name, icon, owner_id } = req.body;
  if (!name || !owner_id) {
    return res.status(400).json({ error: 'Nome e owner_id são obrigatórios.' });
  }
  const server = db.createServer({ name, icon, owner_id });
  res.status(201).json(server);
});

router.get('/servers/:id', (req, res) => {
  const server = db.getServer(req.params.id);
  if (!server) return res.status(404).json({ error: 'Servidor não encontrado' });
  res.json(server);
});

router.post('/servers/join', (req, res) => {
  const { invite_code, user_id } = req.body;
  if (!invite_code || !user_id) {
    return res.status(400).json({ error: 'Código de convite e user_id são obrigatórios.' });
  }
  const result = db.joinServerByCode(invite_code, user_id);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result.server);
});

router.post('/servers/:id/channels', (req, res) => {
  const { name, type, category_id, topic } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }
  const channel = db.createChannel({
    server_id: req.params.id,
    category_id,
    name,
    type,
    topic
  });
  if (!channel) return res.status(404).json({ error: 'Servidor não encontrado' });
  res.status(201).json(channel);
});

// Channel Messages
router.get('/channels/:id/messages', (req, res) => {
  const messages = db.getChannelMessages(req.params.id);
  res.json(messages);
});

router.post('/channels/:id/messages', (req, res) => {
  const { author_id, content, attachments, reply_to_id } = req.body;
  if (!author_id || (!content && (!attachments || attachments.length === 0))) {
    return res.status(400).json({ error: 'Mensagem inválida.' });
  }
  const msg = db.createChannelMessage({
    channel_id: req.params.id,
    author_id,
    content: content || '',
    attachments: attachments || [],
    reply_to_id
  });
  res.status(201).json(msg);
});

router.post('/messages/:id/reactions', (req, res) => {
  const { user_id, emoji } = req.body;
  if (!user_id || !emoji) {
    return res.status(400).json({ error: 'user_id e emoji são obrigatórios.' });
  }
  const msg = db.addReaction({
    message_id: req.params.id,
    user_id,
    emoji
  });
  if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada' });
  res.json(msg);
});

// Direct Messages (DMs)
router.get('/direct', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId obrigatório' });
  res.json(db.getDirectChannels(userId));
});

router.post('/direct', (req, res) => {
  const { user1_id, user2_id } = req.body;
  if (!user1_id || !user2_id) {
    return res.status(400).json({ error: 'user1_id e user2_id são obrigatórios' });
  }
  const dm = db.getOrCreateDirectChannel(user1_id, user2_id);
  res.json(dm);
});

router.get('/direct/:id/messages', (req, res) => {
  const messages = db.getDirectMessages(req.params.id);
  res.json(messages);
});

router.post('/direct/:id/messages', (req, res) => {
  const { author_id, content, attachments } = req.body;
  if (!author_id || (!content && (!attachments || attachments.length === 0))) {
    return res.status(400).json({ error: 'Mensagem inválida.' });
  }
  const msg = db.createDirectMessage({
    channel_id: req.params.id,
    author_id,
    content: content || '',
    attachments: attachments || []
  });
  res.status(201).json(msg);
});

module.exports = router;
