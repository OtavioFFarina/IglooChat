const db = require('../db');

function initSocket(io) {
  // voiceRooms: channelId -> Map(socketId -> participantData)
  const voiceRooms = new Map();
  // userSockets: userId -> Set(socketId)
  const userSockets = new Map();
  // socketToUser: socketId -> { userId, username }
  const socketToUser = new Map();
  // socketVoiceRoom: socketId -> channelId
  const socketVoiceRoom = new Map();

  function broadcastGlobalVoiceStates() {
    const states = [];
    for (const [channelId, participantsMap] of voiceRooms.entries()) {
      const participants = Array.from(participantsMap.values()).map(p => ({
        socketId: p.socketId,
        user: p.user,
        channelId: p.channelId,
        isMuted: p.isMuted,
        isDeafened: p.isDeafened,
        isVideoOn: p.isVideoOn,
        isScreenSharing: p.isScreenSharing,
        isSpeaking: p.isSpeaking
      }));
      if (participants.length > 0) {
        states.push({ channelId, participants });
      }
    }
    io.emit('voice:all_states', states);
  }

  io.on('connection', (socket) => {
    console.log(`[Gateway] Socket connected: ${socket.id}`);

    // Identify user
    socket.on('identify', (user) => {
      if (!user || !user.id) return;
      socketToUser.set(socket.id, user);
      if (!userSockets.has(user.id)) {
        userSockets.set(user.id, new Set());
      }
      userSockets.get(user.id).add(socket.id);
      socket.join(`user_${user.id}`);

      // Update status in DB
      db.updateUser(user.id, { status: user.status || 'online' });
      io.emit('user:presence_updated', { userId: user.id, status: user.status || 'online', custom_status: user.custom_status });

      // Send initial voice states to new connection
      broadcastGlobalVoiceStates();
    });

    // User status change
    socket.on('user:change_status', ({ userId, status, custom_status }) => {
      const updated = db.updateUser(userId, { status, custom_status });
      if (updated) {
        io.emit('user:presence_updated', { userId, status: updated.status, custom_status: updated.custom_status });
      }
    });

    // Text Channel room subscription
    socket.on('channel:join', (channelId) => {
      socket.join(`channel_${channelId}`);
    });

    socket.on('channel:leave', (channelId) => {
      socket.leave(`channel_${channelId}`);
    });

    socket.on('channel:typing', ({ channelId, user, isTyping }) => {
      socket.to(`channel_${channelId}`).emit('channel:typing', { channelId, user, isTyping });
    });

    socket.on('message:send', (msg) => {
      io.to(`channel_${msg.channel_id}`).emit('message:new', msg);
    });

    socket.on('message:reaction', (reactionData) => {
      io.to(`channel_${reactionData.channel_id}`).emit('message:reaction_updated', reactionData);
    });

    // Direct Messages
    socket.on('dm:join', (dmChannelId) => {
      socket.join(`dm_${dmChannelId}`);
    });

    socket.on('dm:typing', ({ dmChannelId, user, isTyping }) => {
      socket.to(`dm_${dmChannelId}`).emit('dm:typing', { dmChannelId, user, isTyping });
    });

    socket.on('dm:message:send', ({ dmChannelId, message }) => {
      io.to(`dm_${dmChannelId}`).emit('dm:message:new', { dmChannelId, message });
    });

    // ==========================================
    // VOICE CHANNELS & SCREEN SHARING (WebRTC)
    // ==========================================
    socket.on('voice:join', ({ channelId, user, isMuted, isDeafened, isVideoOn, isScreenSharing }) => {
      // Leave any existing voice room first
      leaveCurrentVoiceRoom(socket);

      if (!voiceRooms.has(channelId)) {
        voiceRooms.set(channelId, new Map());
      }
      const room = voiceRooms.get(channelId);

      const participantData = {
        socketId: socket.id,
        user,
        channelId,
        isMuted: !!isMuted,
        isDeafened: !!isDeafened,
        isVideoOn: !!isVideoOn,
        isScreenSharing: !!isScreenSharing,
        isSpeaking: false
      };

      // Get existing participants in this room to return to the joiner
      const existingParticipants = Array.from(room.values());

      room.set(socket.id, participantData);
      socketVoiceRoom.set(socket.id, channelId);
      socket.join(`voice_${channelId}`);

      // 1. Reply to joining user with current participants
      socket.emit('voice:room_users', {
        channelId,
        users: existingParticipants
      });

      // 2. Notify other room members that a new user joined
      socket.to(`voice_${channelId}`).emit('voice:user_joined', participantData);

      // 3. Broadcast global voice states to all servers
      broadcastGlobalVoiceStates();

      console.log(`[Voice] User ${user.username} (${socket.id}) joined voice channel ${channelId}`);
    });

    socket.on('voice:leave', () => {
      leaveCurrentVoiceRoom(socket);
    });

    socket.on('voice:state_change', (updates) => {
      const channelId = socketVoiceRoom.get(socket.id);
      if (!channelId || !voiceRooms.has(channelId)) return;

      const room = voiceRooms.get(channelId);
      const participant = room.get(socket.id);
      if (!participant) return;

      Object.assign(participant, updates);

      // Broadcast update to voice room members
      io.to(`voice_${channelId}`).emit('voice:user_state_changed', {
        socketId: socket.id,
        channelId,
        updates
      });

      // If screen share or video changed, broadcast global states so live badge updates
      if ('isScreenSharing' in updates || 'isVideoOn' in updates) {
        broadcastGlobalVoiceStates();
      }
    });

    // WebRTC Signaling relays for Voice & Screen Sharing
    socket.on('webrtc:offer', ({ toSocketId, offer, streamType }) => {
      io.to(toSocketId).emit('webrtc:offer', {
        fromSocketId: socket.id,
        offer,
        streamType // 'camera' or 'screen'
      });
    });

    socket.on('webrtc:answer', ({ toSocketId, answer, streamType }) => {
      io.to(toSocketId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        answer,
        streamType
      });
    });

    socket.on('webrtc:ice_candidate', ({ toSocketId, candidate, streamType }) => {
      io.to(toSocketId).emit('webrtc:ice_candidate', {
        fromSocketId: socket.id,
        candidate,
        streamType
      });
    });

    // ==========================================
    // DIRECT CALLS (1-on-1 DM Calls)
    // ==========================================
    socket.on('dm-call:initiate', ({ dmChannelId, caller, recipientId }) => {
      const recipientSockets = userSockets.get(recipientId);
      if (recipientSockets) {
        for (const sockId of recipientSockets) {
          io.to(sockId).emit('dm-call:incoming', {
            dmChannelId,
            caller
          });
        }
      }
    });

    socket.on('dm-call:accept', ({ dmChannelId, user, callerId }) => {
      const callerSockets = userSockets.get(callerId);
      if (callerSockets) {
        for (const sockId of callerSockets) {
          io.to(sockId).emit('dm-call:accepted', {
            dmChannelId,
            user
          });
        }
      }
    });

    socket.on('dm-call:reject', ({ dmChannelId, callerId }) => {
      const callerSockets = userSockets.get(callerId);
      if (callerSockets) {
        for (const sockId of callerSockets) {
          io.to(sockId).emit('dm-call:rejected', { dmChannelId });
        }
      }
    });

    socket.on('dm-call:end', ({ dmChannelId, recipientId }) => {
      const targetSockets = userSockets.get(recipientId);
      if (targetSockets) {
        for (const sockId of targetSockets) {
          io.to(sockId).emit('dm-call:ended', { dmChannelId });
        }
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      console.log(`[Gateway] Socket disconnected: ${socket.id}`);
      leaveCurrentVoiceRoom(socket);

      const user = socketToUser.get(socket.id);
      if (user && userSockets.has(user.id)) {
        userSockets.get(user.id).delete(socket.id);
        if (userSockets.get(user.id).size === 0) {
          userSockets.delete(user.id);
          // Set user offline if no other sockets
          db.updateUser(user.id, { status: 'offline' });
          io.emit('user:presence_updated', { userId: user.id, status: 'offline' });
        }
      }
      socketToUser.delete(socket.id);
    });

    function leaveCurrentVoiceRoom(sock) {
      const channelId = socketVoiceRoom.get(sock.id);
      if (!channelId) return;

      if (voiceRooms.has(channelId)) {
        const room = voiceRooms.get(channelId);
        const participant = room.get(sock.id);
        room.delete(sock.id);
        if (room.size === 0) {
          voiceRooms.delete(channelId);
        }

        sock.to(`voice_${channelId}`).emit('voice:user_left', {
          socketId: sock.id,
          channelId,
          user: participant ? participant.user : null
        });
        sock.leave(`voice_${channelId}`);
      }

      socketVoiceRoom.delete(sock.id);
      broadcastGlobalVoiceStates();
    }
  });
}

module.exports = initSocket;
