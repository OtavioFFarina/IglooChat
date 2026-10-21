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

// Authentication Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login para continuar.' });
  }
  const token = authHeader.split(' ')[1];
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
  req.user = user;
  req.token = token;
  next();
}

// Optional Auth (populates req.user if token present)
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    req.user = db.getUserByToken(token);
  }
  next();
}

// File / Avatar upload endpoint
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

// =====================================
// AUTHENTICATION ROUTES
// =====================================

router.post('/auth/register', (req, res) => {
  const { email, username, password, avatar } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'E-mail, nome de usuário e senha são obrigatórios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  const result = db.registerUser({ email, username, password, avatar });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result);
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const result = db.loginUser({ email, password });
  if (result.error) {
    return res.status(401).json({ error: result.error });
  }
  res.json(result);
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user, token: req.token });
});

router.post('/auth/logout', requireAuth, (req, res) => {
  db.logoutUser(req.token);
  res.json({ success: true });
});

// =====================================
// USER PROFILE & ACCOUNT MANAGEMENT
// =====================================

router.get('/users', (req, res) => {
  res.json(db.getUsers());
});

router.get('/users/:id', (req, res) => {
  const user = db.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

router.patch('/users/:id', requireAuth, (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Você só pode editar seu próprio perfil.' });
  }
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(updated);
});

router.post('/users/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  }
  const result = db.changePassword(req.user.id, currentPassword, newPassword);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true });
});

router.delete('/users/me', requireAuth, (req, res) => {
  const result = db.deleteAccount(req.user.id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true });
});

// =====================================
// FRIENDS ROUTES (DISCORD-STYLE)
// =====================================

router.get('/friends', requireAuth, (req, res) => {
  res.json(db.getFriends(req.user.id));
});

router.get('/friends/requests', requireAuth, (req, res) => {
  res.json(db.getFriendRequests(req.user.id));
});

router.post('/friends/request', requireAuth, (req, res) => {
  const { target } = req.body;
  if (!target) {
    return res.status(400).json({ error: 'Informe a tag ou nome de usuário.' });
  }
  const result = db.sendFriendRequest(req.user.id, target);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

router.post('/friends/accept', requireAuth, (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'requestId obrigatório.' });
  }
  const result = db.acceptFriendRequest(requestId, req.user.id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

router.post('/friends/reject', requireAuth, (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'requestId obrigatório.' });
  }
  const result = db.rejectFriendRequest(requestId, req.user.id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

router.delete('/friends/:id', requireAuth, (req, res) => {
  const result = db.removeFriend(req.user.id, req.params.id);
  res.json(result);
});

// =====================================
// SERVERS ROUTES
// =====================================

router.get('/servers', optionalAuth, (req, res) => {
  const { userId } = req.query;
  const targetId = userId || (req.user ? req.user.id : null);
  if (targetId) {
    return res.json(db.getUserServers(targetId));
  }
  res.json(db.getServers());
});

router.post('/servers', requireAuth, (req, res) => {
  const { name, icon } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome do servidor é obrigatório.' });
  }
  const server = db.createServer({ name, icon, owner_id: req.user.id });
  res.status(201).json(server);
});

router.get('/servers/:id', requireAuth, (req, res) => {
  const server = db.getServer(req.params.id);
  if (!server) return res.status(404).json({ error: 'Servidor não encontrado' });
  res.json(server);
});

router.patch('/servers/:id', requireAuth, (req, res) => {
  const { name, icon, banner } = req.body;
  const result = db.updateServer(req.params.id, req.user.id, { name, icon, banner });
  if (result.error) {
    return res.status(403).json({ error: result.error });
  }
  res.json(result.server);
});

router.delete('/servers/:id', requireAuth, (req, res) => {
  const result = db.deleteServer(req.params.id, req.user.id);
  if (result.error) {
    return res.status(403).json({ error: result.error });
  }
  res.json(result);
});

router.post('/servers/:id/leave', requireAuth, (req, res) => {
  const result = db.leaveServer(req.params.id, req.user.id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

router.post('/servers/join', requireAuth, (req, res) => {
  const invite_code = req.body.invite_code || req.body.code;
  if (!invite_code) {
    return res.status(400).json({ error: 'Código de convite obrigatório.' });
  }
  const result = db.joinServerByCode(invite_code, req.user.id);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result.server);
});

router.post('/servers/:id/channels', requireAuth, (req, res) => {
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

router.patch('/channels/:id', requireAuth, (req, res) => {
  const { name, topic } = req.body;
  if (!name && topic === undefined) {
    return res.status(400).json({ error: 'Nome ou tópico são obrigatórios.' });
  }
  const result = db.updateChannel({ channel_id: req.params.id, name, topic });
  if (!result) return res.status(404).json({ error: 'Canal não encontrado.' });
  res.json(result);
});

router.delete('/channels/:id', requireAuth, (req, res) => {
  const result = db.deleteChannel(req.params.id);
  if (!result) return res.status(404).json({ error: 'Canal não encontrado.' });
  res.json(result);
});

// =====================================
// CHANNEL MESSAGES
// =====================================

router.get('/channels/:id/messages', requireAuth, (req, res) => {
  const messages = db.getChannelMessages(req.params.id);
  res.json(messages);
});

router.post('/channels/:id/messages', requireAuth, (req, res) => {
  const { content, attachments, reply_to_id, server_id } = req.body;
  if (!content && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Mensagem inválida.' });
  }
  const msg = db.createChannelMessage({
    channel_id: req.params.id,
    server_id: server_id || '',
    author_id: req.user.id,
    content: content || '',
    attachments: attachments || [],
    reply_to_id
  });
  res.status(201).json(msg);
});

router.post('/messages/:id/reactions', requireAuth, (req, res) => {
  const { emoji } = req.body;
  if (!emoji) {
    return res.status(400).json({ error: 'emoji é obrigatório.' });
  }
  const msg = db.addReaction({
    message_id: req.params.id,
    user_id: req.user.id,
    emoji
  });
  if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada' });
  res.json(msg);
});

router.patch('/messages/:id', requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Conteúdo não pode ser vazio.' });
  }
  const result = db.editMessage(req.params.id, req.user.id, content.trim());
  if (result.error) {
    return res.status(403).json({ error: result.error });
  }
  res.json(result);
});

router.delete('/messages/:id', requireAuth, (req, res) => {
  const result = db.deleteMessage(req.params.id, req.user.id);
  if (result.error) {
    return res.status(403).json({ error: result.error });
  }
  res.json(result);
});

router.post('/messages/:id/pin', requireAuth, (req, res) => {
  const result = db.pinMessage(req.params.id, req.user.id);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result);
});

// =====================================
// DIRECT MESSAGES (DMs)
// =====================================

router.get('/direct', requireAuth, (req, res) => {
  res.json(db.getDirectChannels(req.user.id));
});

router.post('/direct', requireAuth, (req, res) => {
  const { user2_id } = req.body;
  if (!user2_id) {
    return res.status(400).json({ error: 'user2_id é obrigatório' });
  }
  const dm = db.getOrCreateDirectChannel(req.user.id, user2_id);
  res.json(dm);
});

router.get('/direct/:id/messages', requireAuth, (req, res) => {
  const messages = db.getDirectMessages(req.params.id);
  res.json(messages);
});

router.post('/direct/:id/messages', requireAuth, (req, res) => {
  const { content, attachments, reply_to_id } = req.body;
  if (!content && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Mensagem inválida.' });
  }
  const msg = db.createDirectMessage({
    channel_id: req.params.id,
    author_id: req.user.id,
    content: content || '',
    attachments: attachments || [],
    reply_to_id: reply_to_id || null
  });
  res.json(msg);
});

// =====================================
// WEBRTC ICE & TURN SERVERS ENDPOINT
// =====================================
let cachedIceServers = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

const ROBUST_ICE_SERVERS = [
  // STUN Servers (Ultra low latency direct candidate discovery)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  // OpenRelay Public TURN (High availability community relay - no private quota limits)
  { urls: 'stun:openrelay.metered.ca:80' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turns:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  // Dedicated Metered Relay Pool
  { urls: 'stun:stun.relay.metered.ca:80' },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: '9264d51bf7b61ba6f3c250bd',
    credential: 'wNe5ZCN1gAGNqtmK'
  },
  {
    urls: 'turn:global.relay.metered.ca:80?transport=tcp',
    username: '9264d51bf7b61ba6f3c250bd',
    credential: 'wNe5ZCN1gAGNqtmK'
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: '9264d51bf7b61ba6f3c250bd',
    credential: 'wNe5ZCN1gAGNqtmK'
  },
  {
    urls: 'turns:global.relay.metered.ca:443?transport=tcp',
    username: '9264d51bf7b61ba6f3c250bd',
    credential: 'wNe5ZCN1gAGNqtmK'
  }
];

router.get('/webrtc/ice-servers', async (req, res) => {
  const now = Date.now();
  if (cachedIceServers && (now - lastFetchTime < CACHE_TTL_MS)) {
    return res.json({ iceServers: cachedIceServers });
  }

  try {
    const fetchRes = await fetch('https://doudizhu-online.metered.live/api/v1/turn/credentials?apiKey=69960ccff638874fa5ab1dcb405d13b1097f', {
      signal: AbortSignal.timeout(3500)
    });
    if (fetchRes.ok) {
      const data = await fetchRes.json();
      if (Array.isArray(data) && data.length > 0) {
        // Merge dynamic servers with OpenRelay and Google STUN
        const dynamicUrls = new Set(data.map(s => s.urls));
        const nonDuplicateRobust = ROBUST_ICE_SERVERS.filter(s => !dynamicUrls.has(s.urls));
        cachedIceServers = [...data, ...nonDuplicateRobust];
        lastFetchTime = now;
        return res.json({ iceServers: cachedIceServers });
      }
    }
  } catch (err) {
    console.warn('[WebRTC ICE] Usando fallback com servidores TURN resilientes:', err.message);
  }

  cachedIceServers = ROBUST_ICE_SERVERS;
  lastFetchTime = now;
  return res.json({ iceServers: cachedIceServers });
});

module.exports = router;
