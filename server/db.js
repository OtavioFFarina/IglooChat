const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dbFile = path.join(__dirname, 'data', 'concord.json');

// Password hashing helpers using native crypto
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) return false;
  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === originalHash;
}

// Initial fresh state (Completely raw: 0 users, 0 pre-registered mocks, 0 friends, 0 servers)
const initialData = {
  users: [],
  tokens: {}, // token -> userId
  friends: {}, // userId -> [friendUserId, ...]
  friend_requests: [], // [{ id, from_id, to_id, status, created_at }]
  servers: [],
  messages: [],
  direct_channels: [],
  direct_messages: []
};

let dbData = null;

function loadDb() {
  if (dbData) return dbData;
  const dataDir = path.dirname(dbFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(dbFile)) {
    try {
      const raw = fs.readFileSync(dbFile, 'utf8');
      dbData = JSON.parse(raw);
      if (!dbData.tokens) dbData.tokens = {};
      if (!dbData.friends) dbData.friends = {};
      if (!dbData.friend_requests) dbData.friend_requests = [];
      if (!dbData.servers) dbData.servers = [];
      if (!dbData.messages) dbData.messages = [];
      if (!dbData.direct_channels) dbData.direct_channels = [];
      if (!dbData.direct_messages) dbData.direct_messages = [];
      return dbData;
    } catch (e) {
      console.error('Error reading concord.json, resetting', e);
    }
  }
  dbData = JSON.parse(JSON.stringify(initialData));
  saveDb();
  return dbData;
}

function saveDb() {
  if (!dbData) return;
  const tmp = dbFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(dbData, null, 2), 'utf8');
  fs.renameSync(tmp, dbFile);
}

// Generate default colorful avatar
function generateDefaultAvatar(username) {
  const colors = ['5865F2', '57F287', 'FEE75C', 'EB459E', 'ED4245'];
  const charCode = username ? username.charCodeAt(0) : 0;
  const bg = colors[charCode % colors.length];
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || 'Concord')}&backgroundColor=${bg}&textColor=ffffff`;
}

// Clean user object for client (removes password)
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...clean } = user;
  return clean;
}

const db = {
  // =====================================
  // AUTHENTICATION
  // =====================================
  registerUser({ email, username, password, avatar }) {
    const data = loadDb();
    const cleanEmail = email.trim().toLowerCase();
    const existing = data.users.find(u => u.email === cleanEmail);
    if (existing) {
      return { error: 'Este e-mail já está cadastrado.' };
    }

    const userId = 'user_' + crypto.randomUUID().substring(0, 8);
    const discriminator = Math.floor(1000 + Math.random() * 9000).toString();
    const userAvatar = avatar && avatar.trim() ? avatar.trim() : generateDefaultAvatar(username);

    const newUser = {
      id: userId,
      email: cleanEmail,
      username: username.trim(),
      discriminator,
      password: hashPassword(password),
      avatar: userAvatar,
      avatar_history: [userAvatar],
      status: 'online',
      status_preference: 'online',
      custom_status: 'No Concord 🚀',
      created_at: new Date().toISOString()
    };

    data.users.push(newUser);
    data.friends[userId] = [];

    // Note: New account starts completely RAW (0 servers, 0 friends) as requested!

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    data.tokens[token] = userId;

    saveDb();
    return {
      user: sanitizeUser(newUser),
      token
    };
  },

  loginUser({ email, password }) {
    const data = loadDb();
    const cleanEmail = email.trim().toLowerCase();
    const user = data.users.find(u => u.email === cleanEmail);
    if (!user) {
      return { error: 'E-mail ou senha incorretos.' };
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return { error: 'E-mail ou senha incorretos.' };
    }

    user.status = 'online';
    const token = crypto.randomBytes(32).toString('hex');
    data.tokens[token] = user.id;

    saveDb();
    return {
      user: sanitizeUser(user),
      token
    };
  },

  getUserByToken(token) {
    if (!token) return null;
    const data = loadDb();
    const userId = data.tokens[token];
    if (!userId) return null;
    const user = data.users.find(u => u.id === userId);
    if (!user) return null;
    const clean = sanitizeUser(user);
    if (clean && user.status_preference && user.status_preference !== 'offline') {
      clean.status = user.status_preference;
    }
    return clean;
  },

  logoutUser(token) {
    const data = loadDb();
    if (token && data.tokens[token]) {
      const userId = data.tokens[token];
      delete data.tokens[token];
      const user = data.users.find(u => u.id === userId);
      if (user) {
        user.status = 'offline';
      }
      saveDb();
    }
  },

  // =====================================
  // USER PROFILE & ACCOUNT MANAGEMENT
  // =====================================
  getUsers() {
    const data = loadDb();
    return data.users.map(sanitizeUser);
  },

  getUser(id) {
    const data = loadDb();
    const user = data.users.find(u => u.id === id);
    return sanitizeUser(user);
  },

  updateUser(id, updates) {
    const data = loadDb();
    const user = data.users.find(u => u.id === id);
    if (user) {
      // Don't allow password or email override through normal update
      const { password, email, ...allowedUpdates } = updates;

      // Track status preference if user explicitly changed status
      if (allowedUpdates.status && allowedUpdates.status !== 'offline') {
        user.status_preference = allowedUpdates.status;
      }

      // Track avatar history if avatar changed
      if (allowedUpdates.avatar && allowedUpdates.avatar !== user.avatar) {
        if (!user.avatar_history) user.avatar_history = [];
        if (user.avatar && !user.avatar_history.includes(user.avatar)) {
          user.avatar_history.unshift(user.avatar);
        }
        if (!user.avatar_history.includes(allowedUpdates.avatar)) {
          user.avatar_history.unshift(allowedUpdates.avatar);
        }
        // Limit to 6 recent
        user.avatar_history = user.avatar_history.slice(0, 6);
      }

      Object.assign(user, allowedUpdates);
      saveDb();
    }
    return sanitizeUser(user);
  },

  changePassword(userId, currentPassword, newPassword) {
    const data = loadDb();
    const user = data.users.find(u => u.id === userId);
    if (!user) return { error: 'Usuário não encontrado.' };

    if (!verifyPassword(currentPassword, user.password)) {
      return { error: 'A senha atual está incorreta.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { error: 'A nova senha deve conter no mínimo 6 caracteres.' };
    }

    user.password = hashPassword(newPassword);
    saveDb();
    return { success: true };
  },

  deleteAccount(userId) {
    const data = loadDb();
    const index = data.users.findIndex(u => u.id === userId);
    if (index === -1) return { error: 'Usuário não encontrado.' };

    // 1. Remove user
    data.users.splice(index, 1);

    // 2. Clear tokens
    for (const [tok, uid] of Object.entries(data.tokens)) {
      if (uid === userId) delete data.tokens[tok];
    }

    // 3. Remove from friends lists
    delete data.friends[userId];
    for (const [friendOwner, list] of Object.entries(data.friends)) {
      data.friends[friendOwner] = list.filter(fId => fId !== userId);
    }

    // 4. Remove friend requests
    data.friend_requests = data.friend_requests.filter(
      r => r.from_id !== userId && r.to_id !== userId
    );

    // 5. Delete servers owned by this user
    const ownedServerIds = data.servers.filter(s => s.owner_id === userId).map(s => s.id);
    data.servers = data.servers.filter(s => s.owner_id !== userId);

    // 6. Remove messages belonging to deleted servers
    data.messages = data.messages.filter(m => !ownedServerIds.includes(m.server_id));

    // 7. Remove user from membership in other servers
    for (const srv of data.servers) {
      srv.members = srv.members.filter(m => m.user_id !== userId);
    }

    // 8. Remove from direct channels
    data.direct_channels = data.direct_channels.filter(dc => !dc.members.includes(userId));

    saveDb();
    return { success: true };
  },

  // =====================================
  // REAL FRIENDS SYSTEM (DISCORD-STYLE)
  // =====================================
  getFriends(userId) {
    const data = loadDb();
    const friendIds = data.friends[userId] || [];
    return friendIds
      .map(id => sanitizeUser(data.users.find(u => u.id === id)))
      .filter(Boolean);
  },

  getFriendRequests(userId) {
    const data = loadDb();
    const incoming = data.friend_requests
      .filter(r => r.to_id === userId && r.status === 'pending')
      .map(r => ({
        ...r,
        user: sanitizeUser(data.users.find(u => u.id === r.from_id))
      }));

    const outgoing = data.friend_requests
      .filter(r => r.from_id === userId && r.status === 'pending')
      .map(r => ({
        ...r,
        user: sanitizeUser(data.users.find(u => u.id === r.to_id))
      }));

    return { incoming, outgoing };
  },

  sendFriendRequest(fromUserId, targetQuery) {
    const data = loadDb();
    const cleanQuery = targetQuery.trim();
    if (!cleanQuery) return { error: 'Insira o nome de usuário.' };

    let targetUser = null;

    if (cleanQuery.includes('#')) {
      const [uName, disc] = cleanQuery.split('#');
      targetUser = data.users.find(
        u => u.username.toLowerCase() === uName.trim().toLowerCase() && u.discriminator === disc.trim()
      );
    } else {
      const matching = data.users.filter(u => u.username.toLowerCase() === cleanQuery.toLowerCase());
      if (matching.length === 1) {
        targetUser = matching[0];
      } else if (matching.length > 1) {
        return { error: 'Mais de um usuário possui este nome. Especifique com a tag (Ex: Nome#1234).' };
      }
    }

    if (!targetUser) {
      return { error: 'Hum, isso não funcionou. Verifique se o nome de usuário e a tag estão corretos.' };
    }

    if (targetUser.id === fromUserId) {
      return { error: 'Você não pode adicionar a si mesmo como amigo.' };
    }

    const currentFriends = data.friends[fromUserId] || [];
    if (currentFriends.includes(targetUser.id)) {
      return { error: 'Você já é amigo deste usuário!' };
    }

    // Check if target already sent a request to fromUser (auto-accept!)
    const reciprocalRequest = data.friend_requests.find(
      r => r.from_id === targetUser.id && r.to_id === fromUserId && r.status === 'pending'
    );

    if (reciprocalRequest) {
      reciprocalRequest.status = 'accepted';
      if (!data.friends[fromUserId]) data.friends[fromUserId] = [];
      if (!data.friends[targetUser.id]) data.friends[targetUser.id] = [];
      data.friends[fromUserId].push(targetUser.id);
      data.friends[targetUser.id].push(fromUserId);
      saveDb();
      return {
        success: true,
        autoAccepted: true,
        friend: sanitizeUser(targetUser)
      };
    }

    // Check if already sent
    const alreadySent = data.friend_requests.find(
      r => r.from_id === fromUserId && r.to_id === targetUser.id && r.status === 'pending'
    );
    if (alreadySent) {
      return { error: 'Você já enviou um pedido de amizade para este usuário.' };
    }

    const newRequest = {
      id: 'freq_' + crypto.randomUUID().substring(0, 8),
      from_id: fromUserId,
      to_id: targetUser.id,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    data.friend_requests.push(newRequest);
    saveDb();

    return {
      success: true,
      autoAccepted: false,
      request: {
        ...newRequest,
        user: sanitizeUser(targetUser)
      }
    };
  },

  acceptFriendRequest(requestId, userId) {
    const data = loadDb();
    const req = data.friend_requests.find(r => r.id === requestId && r.to_id === userId && r.status === 'pending');
    if (!req) return { error: 'Pedido de amizade não encontrado ou já processado.' };

    req.status = 'accepted';
    if (!data.friends[userId]) data.friends[userId] = [];
    if (!data.friends[req.from_id]) data.friends[req.from_id] = [];

    if (!data.friends[userId].includes(req.from_id)) {
      data.friends[userId].push(req.from_id);
    }
    if (!data.friends[req.from_id].includes(userId)) {
      data.friends[req.from_id].push(userId);
    }

    saveDb();
    const newFriend = sanitizeUser(data.users.find(u => u.id === req.from_id));
    return { success: true, friend: newFriend };
  },

  rejectFriendRequest(requestId, userId) {
    const data = loadDb();
    const index = data.friend_requests.findIndex(r => r.id === requestId && r.to_id === userId);
    if (index === -1) return { error: 'Pedido não encontrado.' };

    data.friend_requests.splice(index, 1);
    saveDb();
    return { success: true };
  },

  removeFriend(userId, friendId) {
    const data = loadDb();
    if (data.friends[userId]) {
      data.friends[userId] = data.friends[userId].filter(id => id !== friendId);
    }
    if (data.friends[friendId]) {
      data.friends[friendId] = data.friends[friendId].filter(id => id !== userId);
    }
    saveDb();
    return { success: true };
  },

  // =====================================
  // SERVERS & CHANNELS
  // =====================================
  getServers() {
    const data = loadDb();
    return data.servers;
  },

  getUserServers(userId) {
    const data = loadDb();
    return data.servers.filter(s => s.members.some(m => m.user_id === userId));
  },

  getServer(id) {
    const data = loadDb();
    const srv = data.servers.find(s => s.id === id);
    if (!srv) return null;
    const enrichedMembers = srv.members.map(m => ({
      ...m,
      user: sanitizeUser(data.users.find(u => u.id === m.user_id)) || { id: m.user_id, username: 'Usuário' }
    }));
    return {
      ...srv,
      members: enrichedMembers
    };
  },

  createServer({ name, icon, owner_id }) {
    const data = loadDb();
    const newServerId = 'srv_' + crypto.randomUUID().substring(0, 8);
    const catTextId = 'cat_text_' + crypto.randomUUID().substring(0, 8);
    const catVoiceId = 'cat_voice_' + crypto.randomUUID().substring(0, 8);
    const chGeralId = 'ch_geral_' + crypto.randomUUID().substring(0, 8);
    const chVoiceId = 'ch_voice_' + crypto.randomUUID().substring(0, 8);
    const inviteCode = 'concord-' + Math.random().toString(36).substring(2, 8);

    const newServer = {
      id: newServerId,
      name,
      icon: icon || null,
      owner_id,
      invite_code: inviteCode,
      created_at: new Date().toISOString(),
      categories: [
        {
          id: catTextId,
          server_id: newServerId,
          name: 'CANAIS DE TEXTO',
          position: 0,
          channels: [
            {
              id: chGeralId,
              server_id: newServerId,
              category_id: catTextId,
              name: 'geral',
              type: 'text',
              topic: 'Canal geral de conversas',
              position: 0,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: catVoiceId,
          server_id: newServerId,
          name: 'CANAIS DE VOZ',
          position: 1,
          channels: [
            {
              id: chVoiceId,
              server_id: newServerId,
              category_id: catVoiceId,
              name: 'Geral (Voz & Tela)',
              type: 'voice',
              topic: 'Converse e compartilhe tela',
              position: 0,
              created_at: new Date().toISOString()
            }
          ]
        }
      ],
      members: [
        {
          server_id: newServerId,
          user_id: owner_id,
          role: 'owner',
          joined_at: new Date().toISOString()
        }
      ]
    };

    data.servers.push(newServer);
    saveDb();
    return this.getServer(newServerId);
  },

  updateServer(serverId, userId, { name, icon }) {
    const data = loadDb();
    const server = data.servers.find(s => s.id === serverId);
    if (!server) return { error: 'Servidor não encontrado.' };
    if (server.owner_id !== userId) return { error: 'Apenas o dono pode alterar as configurações do servidor.' };

    if (name && name.trim()) server.name = name.trim();
    if (icon !== undefined) server.icon = icon ? icon.trim() : null;

    saveDb();
    return { success: true, server: this.getServer(serverId) };
  },

  deleteServer(serverId, userId) {
    const data = loadDb();
    const index = data.servers.findIndex(s => s.id === serverId);
    if (index === -1) return { error: 'Servidor não encontrado.' };

    const server = data.servers[index];
    if (server.owner_id !== userId) {
      return { error: 'Apenas o dono tem permissão para excluir este servidor.' };
    }

    // Delete server
    data.servers.splice(index, 1);

    // Clean channel messages
    data.messages = data.messages.filter(m => m.server_id !== serverId);

    saveDb();
    return { success: true, serverId };
  },

  leaveServer(serverId, userId) {
    const data = loadDb();
    const server = data.servers.find(s => s.id === serverId);
    if (!server) return { error: 'Servidor não encontrado.' };

    if (server.owner_id === userId) {
      return { error: 'O dono não pode sair do próprio servidor. Você deve transferir a posse ou excluir o servidor.' };
    }

    const memberIndex = server.members.findIndex(m => m.user_id === userId);
    if (memberIndex === -1) return { error: 'Você não é membro deste servidor.' };

    server.members.splice(memberIndex, 1);
    saveDb();
    return { success: true, serverId };
  },

  joinServerByCode(inviteCode, userId) {
    const data = loadDb();
    const server = data.servers.find(s => s.invite_code.toLowerCase() === inviteCode.trim().toLowerCase());
    if (!server) return { error: 'Convite inválido ou expirado.' };

    const alreadyMember = server.members.some(m => m.user_id === userId);
    if (!alreadyMember) {
      server.members.push({
        server_id: server.id,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString()
      });
      saveDb();
    }
    return { server: this.getServer(server.id) };
  },

  createChannel({ server_id, category_id, name, type, topic }) {
    const data = loadDb();
    const server = data.servers.find(s => s.id === server_id);
    if (!server) return null;

    let targetCat = server.categories.find(c => c.id === category_id);
    if (!targetCat) {
      targetCat = server.categories.find(c => type === 'voice' ? c.name.includes('VOZ') : c.name.includes('TEXTO')) || server.categories[0];
    }

    const cleanName = type === 'text' ? name.toLowerCase().replace(/\s+/g, '-') : name;
    const newChannel = {
      id: 'ch_' + crypto.randomUUID().substring(0, 8),
      server_id,
      category_id: targetCat ? targetCat.id : null,
      name: cleanName,
      type,
      topic: topic || '',
      position: targetCat ? targetCat.channels.length : 0,
      created_at: new Date().toISOString()
    };

    if (targetCat) {
      targetCat.channels.push(newChannel);
    }
    saveDb();
    return newChannel;
  },

  updateChannel({ channel_id, name, topic }) {
    const data = loadDb();
    for (const server of data.servers) {
      for (const cat of (server.categories || [])) {
        const ch = (cat.channels || []).find(c => c.id === channel_id);
        if (ch) {
          if (name !== undefined) {
            ch.name = ch.type === 'text' ? name.toLowerCase().replace(/\s+/g, '-') : name.trim();
          }
          if (topic !== undefined) {
            ch.topic = topic;
          }
          saveDb();
          return { channel: ch, server: this.getServer(server.id) };
        }
      }
    }
    return null;
  },

  deleteChannel(channel_id) {
    const data = loadDb();
    for (const server of data.servers) {
      for (const cat of (server.categories || [])) {
        const idx = (cat.channels || []).findIndex(c => c.id === channel_id);
        if (idx !== -1) {
          const removed = cat.channels.splice(idx, 1)[0];
          data.messages = data.messages.filter(m => m.channel_id !== channel_id);
          saveDb();
          return { channel: removed, server: this.getServer(server.id) };
        }
      }
    }
    return null;
  },

  // =====================================
  // MESSAGES
  // =====================================
  getChannelMessages(channelId) {
    const data = loadDb();
    const msgs = data.messages.filter(m => m.channel_id === channelId);
    return msgs.map(m => {
      let reply_to = null;
      if (m.reply_to_id) {
        const parent = msgs.find(p => p.id === m.reply_to_id) || data.messages.find(p => p.id === m.reply_to_id);
        if (parent) {
          reply_to = {
            id: parent.id,
            content: parent.content,
            author: sanitizeUser(data.users.find(u => u.id === parent.author_id)) || { id: parent.author_id, username: 'Usuário' }
          };
        }
      }
      return {
        ...m,
        reply_to,
        author: sanitizeUser(data.users.find(u => u.id === m.author_id)) || { id: m.author_id, username: 'Usuário' }
      };
    });
  },

  createChannelMessage({ channel_id, server_id, author_id, content, attachments = [], reply_to_id = null }) {
    const data = loadDb();
    let actualServerId = server_id;
    if (!actualServerId) {
      const s = data.servers.find(srv => (srv.categories || []).some(cat => (cat.channels || []).some(ch => ch.id === channel_id)));
      if (s) actualServerId = s.id;
    }
    const newMsg = {
      id: 'msg_' + crypto.randomUUID(),
      channel_id,
      server_id: actualServerId || '',
      author_id,
      content,
      attachments,
      reply_to_id,
      reactions: [],
      created_at: new Date().toISOString()
    };
    data.messages.push(newMsg);
    saveDb();

    let reply_to = null;
    if (reply_to_id) {
      const parent = data.messages.find(p => p.id === reply_to_id);
      if (parent) {
        reply_to = {
          id: parent.id,
          content: parent.content,
          author: sanitizeUser(data.users.find(u => u.id === parent.author_id)) || { id: parent.author_id, username: 'Usuário' }
        };
      }
    }

    return {
      ...newMsg,
      reply_to,
      author: sanitizeUser(data.users.find(u => u.id === author_id))
    };
  },

  addReaction({ message_id, user_id, emoji }) {
    const data = loadDb();
    const msg = data.messages.find(m => m.id === message_id);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = [];

    const existingReaction = msg.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      if (existingReaction.users.includes(user_id)) {
        existingReaction.users = existingReaction.users.filter(u => u !== user_id);
        existingReaction.count = existingReaction.users.length;
        if (existingReaction.count === 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(user_id);
        existingReaction.count = existingReaction.users.length;
      }
    } else {
      msg.reactions.push({
        emoji,
        count: 1,
        users: [user_id]
      });
    }
    saveDb();
    return msg;
  },

  editMessage(messageId, userId, newContent) {
    const data = loadDb();
    let msg = data.messages.find(m => m.id === messageId);
    let isDM = false;
    if (!msg) {
      msg = data.direct_messages.find(m => m.id === messageId);
      isDM = true;
    }
    if (!msg) return { error: 'Mensagem não encontrada.' };
    if (msg.author_id !== userId) {
      return { error: 'Você só pode editar suas próprias mensagens.' };
    }

    msg.content = newContent;
    msg.edited_at = new Date().toISOString();
    saveDb();

    return {
      message: {
        ...msg,
        author: sanitizeUser(data.users.find(u => u.id === msg.author_id))
      },
      isDM
    };
  },

  deleteMessage(messageId, userId) {
    const data = loadDb();
    let index = data.messages.findIndex(m => m.id === messageId);
    let isDM = false;
    let channelId = '';

    if (index !== -1) {
      const msg = data.messages[index];
      channelId = msg.channel_id;
      // Check if user is author or server owner
      const server = data.servers.find(s => s.id === msg.server_id || (s.categories || []).some(cat => (cat.channels || []).some(ch => ch.id === msg.channel_id)));
      const isOwner = server && server.owner_id === userId;
      if (msg.author_id !== userId && !isOwner) {
        return { error: 'Você não tem permissão para excluir esta mensagem.' };
      }
      data.messages.splice(index, 1);
    } else {
      index = data.direct_messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        const msg = data.direct_messages[index];
        channelId = msg.channel_id;
        if (msg.author_id !== userId) {
          return { error: 'Você só pode excluir suas próprias mensagens.' };
        }
        data.direct_messages.splice(index, 1);
        isDM = true;
      } else {
        return { error: 'Mensagem não encontrada.' };
      }
    }

    saveDb();
    return { success: true, messageId, channelId, isDM };
  },

  pinMessage(messageId, userId) {
    const data = loadDb();
    let msg = data.messages.find(m => m.id === messageId);
    let isDM = false;
    if (!msg) {
      msg = data.direct_messages.find(m => m.id === messageId);
      isDM = true;
    }
    if (!msg) return { error: 'Mensagem não encontrada.' };

    msg.is_pinned = !msg.is_pinned;
    saveDb();

    return {
      message: {
        ...msg,
        author: sanitizeUser(data.users.find(u => u.id === msg.author_id))
      },
      isDM
    };
  },

  // =====================================
  // DIRECT MESSAGES (DMs)
  // =====================================
  getDirectChannels(userId) {
    const data = loadDb();
    const channels = data.direct_channels.filter(
      c => (c.members && c.members.includes(userId)) || c.user1_id === userId || c.user2_id === userId
    );

    return channels.map(c => {
      let otherUserId = '';
      if (c.members && Array.isArray(c.members)) {
        otherUserId = c.members.find(m => m !== userId) || userId;
      } else {
        otherUserId = c.user1_id === userId ? c.user2_id : c.user1_id;
      }
      const recipient = sanitizeUser(data.users.find(u => u.id === otherUserId)) || { id: otherUserId, username: 'Usuário' };
      const lastMsg = data.direct_messages
        .filter(m => m.channel_id === c.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      return {
        id: c.id,
        recipient,
        last_message: lastMsg ? {
          content: lastMsg.content,
          created_at: lastMsg.created_at
        } : null,
        updated_at: c.updated_at
      };
    }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  },

  getOrCreateDirectChannel(user1Id, user2Id) {
    const data = loadDb();
    let dm = data.direct_channels.find(
      c => (c.members && c.members.includes(user1Id) && c.members.includes(user2Id)) ||
           (c.user1_id === user1Id && c.user2_id === user2Id) ||
           (c.user1_id === user2Id && c.user2_id === user1Id)
    );
    if (!dm) {
      dm = {
        id: 'dm_' + crypto.randomUUID().substring(0, 8),
        members: [user1Id, user2Id],
        user1_id: user1Id,
        user2_id: user2Id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      data.direct_channels.push(dm);
      saveDb();
    }
    const recipient = sanitizeUser(data.users.find(u => u.id === user2Id));
    return {
      id: dm.id,
      recipient,
      updated_at: dm.updated_at
    };
  },

  getDirectMessages(channelId) {
    const data = loadDb();
    const msgs = data.direct_messages.filter(m => m.channel_id === channelId);
    return msgs.map(m => {
      let reply_to = null;
      if (m.reply_to_id) {
        const parent = msgs.find(p => p.id === m.reply_to_id) || data.direct_messages.find(p => p.id === m.reply_to_id);
        if (parent) {
          reply_to = {
            id: parent.id,
            content: parent.content,
            author: sanitizeUser(data.users.find(u => u.id === parent.author_id)) || { id: parent.author_id, username: 'Usuário' }
          };
        }
      }
      return {
        ...m,
        reply_to,
        author: sanitizeUser(data.users.find(u => u.id === m.author_id)) || { id: m.author_id, username: 'Usuário' }
      };
    });
  },

  createDirectMessage({ channel_id, author_id, content, attachments = [], reply_to_id = null }) {
    const data = loadDb();
    const newMsg = {
      id: 'dm_msg_' + crypto.randomUUID(),
      channel_id,
      author_id,
      content,
      attachments,
      reply_to_id,
      created_at: new Date().toISOString()
    };
    data.direct_messages.push(newMsg);
    const dm = data.direct_channels.find(c => c.id === channel_id);
    if (dm) dm.updated_at = new Date().toISOString();
    saveDb();

    let reply_to = null;
    if (reply_to_id) {
      const parent = data.direct_messages.find(p => p.id === reply_to_id);
      if (parent) {
        reply_to = {
          id: parent.id,
          content: parent.content,
          author: sanitizeUser(data.users.find(u => u.id === parent.author_id)) || { id: parent.author_id, username: 'Usuário' }
        };
      }
    }

    return {
      ...newMsg,
      reply_to,
      author: sanitizeUser(data.users.find(u => u.id === author_id))
    };
  },

  resetDatabase() {
    dbData = JSON.parse(JSON.stringify(initialData));
    saveDb();
    return dbData;
  }
};

module.exports = db;
