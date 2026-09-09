require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Server } = require('socket.io');

const apiRouter = require('./routes/api');
const initSocket = require('./socket');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads static directory
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api', apiRouter);

// Serve Client in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback for SPA routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    name: 'IglooChat API Server',
    status: 'online',
    port: PORT,
    endpoints: {
      api: '/api',
      uploads: '/uploads',
      gateway: 'Socket.IO on same port'
    }
  });
});

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` IglooChat Server running at: http://localhost:${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api`);
  console.log(` Uploads: http://localhost:${PORT}/uploads`);
  console.log(` WebRTC Gateway: Active on Socket.IO`);
  console.log(`=========================================`);
});
