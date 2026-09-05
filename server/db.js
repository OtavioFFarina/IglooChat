const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); const uuidv4 = () => crypto.randomUUID();

const dbFile = path.join(__dirname, 'data', 'concord.json');

// Initial default state
const initialData = {
  users: [
    {
      id: 'user_otavio',
      username: 'Otávio',
      discriminator: '0001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      custom_status: 'Codando o Concord 🚀',
      created_at: new Date().toISOString()
    },
    {
      id: 'user_alex',
      username: 'AlexDev',
      discriminator: '1337',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'idle',
      custom_status: 'Compilando TypeScript...',
      created_at: new Date().toISOString()
    },
    {
      id: 'user_bia',
      username: 'BiaGamer',
      discriminator: '2048',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      status: 'dnd',
      custom_status: 'Ao vivo na Twitch 🎮',
      created_at: new Date().toISOString()
    },
    {
      id: 'user_carlos',
      username: 'CarlosUI',
      discriminator: '4096',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      custom_status: 'Ajustando pixels no Figma 🎨',
      created_at: new Date().toISOString()
    }
  ],
  servers: [
    {
      id: 'srv_concord_hub',
      name: 'Concord Hub Oficial',
      icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      owner_id: 'user_otavio',
      invite_code: 'concord-oficial',
      created_at: new Date().toISOString(),
      categories: [
        {
          id: 'cat_hub_text',
          server_id: 'srv_concord_hub',
          name: 'CANAIS DE TEXTO',
          position: 0,
          channels: [
            {
              id: 'ch_hub_geral',
              server_id: 'srv_concord_hub',
              category_id: 'cat_hub_text',
              name: 'geral',
              type: 'text',
              topic: 'Bate-papo geral da comunidade Concord',
              position: 0,
              created_at: new Date().toISOString()
            },
            {
              id: 'ch_hub_dev',
              server_id: 'srv_concord_hub',
              category_id: 'cat_hub_text',
              name: 'desenvolvimento',
              type: 'text',
              topic: 'Discussões sobre WebRTC, Socket.io e React',
              position: 1,
              created_at: new Date().toISOString()
            },
            {
              id: 'ch_hub_clips',
              server_id: 'srv_concord_hub',
              category_id: 'cat_hub_text',
              name: 'clips-e-telas',
              type: 'text',
              topic: 'Compartilhe suas telas, artes e capturas!',
              position: 2,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: 'cat_hub_voice',
          server_id: 'srv_concord_hub',
          name: 'CANAIS DE VOZ & TRANSMISSÃO',
          position: 1,
          channels: [
            {
              id: 'ch_hub_voice1',
              server_id: 'srv_concord_hub',
              category_id: 'cat_hub_voice',
              name: 'Sala de Reunião & Tela',
              type: 'voice',
              topic: 'Canal de voz com compartilhamento de tela HD',
              position: 0,
              created_at: new Date().toISOString()
            },
            {
              id: 'ch_hub_voice2',
              server_id: 'srv_concord_hub',
              category_id: 'cat_hub_voice',
              name: 'Lounge & Games',
              type: 'voice',
              topic: 'Bate-papo descontraído e streaming',
              position: 1,
              created_at: new Date().toISOString()
            }
          ]
        }
      ],
      members: [
        { server_id: 'srv_concord_hub', user_id: 'user_otavio', role: 'owner', joined_at: new Date().toISOString() },
        { server_id: 'srv_concord_hub', user_id: 'user_alex', role: 'admin', joined_at: new Date().toISOString() },
        { server_id: 'srv_concord_hub', user_id: 'user_bia', role: 'member', joined_at: new Date().toISOString() },
        { server_id: 'srv_concord_hub', user_id: 'user_carlos', role: 'member', joined_at: new Date().toISOString() }
      ]
    },
    {
      id: 'srv_dev_pair',
      name: 'Dev & Pair Programming',
      icon: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
      owner_id: 'user_alex',
      invite_code: 'dev-pair-2026',
      created_at: new Date().toISOString(),
      categories: [
        {
          id: 'cat_dev_text',
          server_id: 'srv_dev_pair',
          name: 'DISCUSSÃO TÉCNICA',
          position: 0,
          channels: [
            {
              id: 'ch_dev_geral',
              server_id: 'srv_dev_pair',
              category_id: 'cat_dev_text',
              name: 'code-review',
              type: 'text',
              topic: 'Revisões de PRs e snippets',
              position: 0,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: 'cat_dev_voice',
          server_id: 'srv_dev_pair',
          name: 'PAIR PROGRAMMING',
          position: 1,
          channels: [
            {
              id: 'ch_dev_voice1',
              server_id: 'srv_dev_pair',
              category_id: 'cat_dev_voice',
              name: 'Pair Programming 1 (Screen)',
              type: 'voice',
              topic: 'Transmita seu editor ou terminal para pair programming',
              position: 0,
              created_at: new Date().toISOString()
            }
          ]
        }
      ],
      members: [
        { server_id: 'srv_dev_pair', user_id: 'user_otavio', role: 'member', joined_at: new Date().toISOString() },
        { server_id: 'srv_dev_pair', user_id: 'user_alex', role: 'owner', joined_at: new Date().toISOString() },
        { server_id: 'srv_dev_pair', user_id: 'user_carlos', role: 'member', joined_at: new Date().toISOString() }
      ]
    }
  ],
  messages: [
    {
      id: 'msg_1',
      channel_id: 'ch_hub_geral',
      author_id: 'user_otavio',
      content: 'Bem-vindos ao **Concord**! 🚀 O sistema de voz, vídeo e compartilhamento de tela em tempo real já está 100% ativo.',
      attachments: [],
      reactions: [{ emoji: '🔥', count: 2, users: ['user_alex', 'user_carlos'] }, { emoji: '🚀', count: 3, users: ['user_otavio', 'user_alex', 'user_bia'] }],
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'msg_2',
      channel_id: 'ch_hub_geral',
      author_id: 'user_alex',
      content: 'Muito bom! Testei o canal de voz `Sala de Reunião & Tela` e o compartilhamento de tela com WebRTC funcionou liso com baixíssima latência.',
      attachments: [],
      reactions: [{ emoji: '💯', count: 1, users: ['user_otavio'] }],
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'msg_3',
      channel_id: 'ch_hub_geral',
      author_id: 'user_carlos',
      content: 'A interface no padrão dark oficial do Discord com cores fiéis ficou espetacular! Abram em abas diferentes para testar as chamadas e o streaming de tela simultâneo.',
      attachments: [],
      reactions: [{ emoji: '❤️', count: 2, users: ['user_otavio', 'user_alex'] }],
      created_at: new Date(Date.now() - 900000).toISOString()
    }
  ],
  direct_channels: [
    {
      id: 'dm_otavio_alex',
      members: ['user_otavio', 'user_alex'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dm_otavio_bia',
      members: ['user_otavio', 'user_bia'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  direct_messages: [
    {
      id: 'dm_msg_1',
      channel_id: 'dm_otavio_alex',
      author_id: 'user_alex',
      content: 'E aí Otávio! Bora testar a call privada e o compartilhamento de tela 1-a-1?',
      attachments: [],
      created_at: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: 'dm_msg_2',
      channel_id: 'dm_otavio_alex',
      author_id: 'user_otavio',
      content: 'Bora! Só clicar no botão de iniciar chamada telefônica no topo deste chat privado.',
      attachments: [],
      created_at: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'dm_msg_3',
      channel_id: 'dm_otavio_bia',
      author_id: 'user_bia',
      content: 'Opa Otávio, quando for abrir call de games me chama pra transmitir o gameplay ao vivo!',
      attachments: [],
      created_at: new Date(Date.now() - 120000).toISOString()
    }
  ]
};

let dbData = null;

function loadDb() {
  if (dbData) return dbData;
  if (!fs.existsSync(path.dirname(dbFile))) {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  }
  if (fs.existsSync(dbFile)) {
    try {
      const raw = fs.readFileSync(dbFile, 'utf8');
      dbData = JSON.parse(raw);
      return dbData;
    } catch (e) {
      console.error('Error reading db.json, resetting to initialData', e);
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

// Database Operations
const db = {
  getUsers() {
    const data = loadDb();
    return data.users;
  },
  getUser(id) {
    const data = loadDb();
    return data.users.find(u => u.id === id) || null;
  },
  updateUser(id, updates) {
    const data = loadDb();
    const user = data.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates);
      saveDb();
    }
    return user;
  },
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
    // Enrich members with user data
    const enrichedMembers = srv.members.map(m => ({
      ...m,
      user: data.users.find(u => u.id === m.user_id) || { id: m.user_id, username: 'Desconhecido' }
    }));
    return {
      ...srv,
      members: enrichedMembers
    };
  },
  createServer({ name, icon, owner_id }) {
    const data = loadDb();
    const newServerId = 'srv_' + uuidv4().substring(0, 8);
    const catTextId = 'cat_text_' + uuidv4().substring(0, 8);
    const catVoiceId = 'cat_voice_' + uuidv4().substring(0, 8);
    const chGeralId = 'ch_geral_' + uuidv4().substring(0, 8);
    const chVoiceId = 'ch_voice_' + uuidv4().substring(0, 8);
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
      id: 'ch_' + uuidv4().substring(0, 8),
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
  getChannelMessages(channelId) {
    const data = loadDb();
    const msgs = data.messages.filter(m => m.channel_id === channelId);
    return msgs.map(m => ({
      ...m,
      author: data.users.find(u => u.id === m.author_id) || { id: m.author_id, username: 'Usuário' }
    }));
  },
  createChannelMessage({ channel_id, author_id, content, attachments = [], reply_to_id = null }) {
    const data = loadDb();
    const newMsg = {
      id: 'msg_' + uuidv4(),
      channel_id,
      author_id,
      content,
      attachments,
      reply_to_id,
      reactions: [],
      created_at: new Date().toISOString()
    };
    data.messages.push(newMsg);
    saveDb();
    return {
      ...newMsg,
      author: data.users.find(u => u.id === author_id)
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
        // Toggle off
        existingReaction.users = existingReaction.users.filter(u => u !== user_id);
        existingReaction.count = existingReaction.users.length;
        if (existingReaction.count === 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add
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
  getDirectChannels(userId) {
    const data = loadDb();
    const userDMs = data.direct_channels.filter(dm => dm.members.includes(userId));
    return userDMs.map(dm => {
      const recipientId = dm.members.find(m => m !== userId);
      const recipient = data.users.find(u => u.id === recipientId) || { id: recipientId, username: 'Usuário' };
      const msgs = data.direct_messages.filter(m => m.channel_id === dm.id);
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      return {
        id: dm.id,
        recipient,
        last_message: lastMsg,
        updated_at: dm.updated_at
      };
    });
  },
  getOrCreateDirectChannel(user1Id, user2Id) {
    const data = loadDb();
    let dm = data.direct_channels.find(c =>
      c.members.length === 2 && c.members.includes(user1Id) && c.members.includes(user2Id)
    );
    if (!dm) {
      dm = {
        id: 'dm_' + uuidv4().substring(0, 8),
        members: [user1Id, user2Id],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      data.direct_channels.push(dm);
      saveDb();
    }
    const recipient = data.users.find(u => u.id === user2Id);
    return {
      id: dm.id,
      recipient,
      updated_at: dm.updated_at
    };
  },
  getDirectMessages(channelId) {
    const data = loadDb();
    const msgs = data.direct_messages.filter(m => m.channel_id === channelId);
    return msgs.map(m => ({
      ...m,
      author: data.users.find(u => u.id === m.author_id) || { id: m.author_id, username: 'Usuário' }
    }));
  },
  createDirectMessage({ channel_id, author_id, content, attachments = [] }) {
    const data = loadDb();
    const newMsg = {
      id: 'dm_msg_' + uuidv4(),
      channel_id,
      author_id,
      content,
      attachments,
      created_at: new Date().toISOString()
    };
    data.direct_messages.push(newMsg);
    const dm = data.direct_channels.find(c => c.id === channel_id);
    if (dm) dm.updated_at = new Date().toISOString();
    saveDb();
    return {
      ...newMsg,
      author: data.users.find(u => u.id === author_id)
    };
  }
};

module.exports = db;
