import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { User, Server, Channel, Message, DirectChannel, VoiceParticipant, DirectCallState } from '../types';
import { socket } from '../services/socket';
import { WebRTCManager } from '../services/webrtc';
import { audioFX } from '../services/audioEffects';

interface ConcordContextType {
  currentUser: User;
  allUsers: User[];
  servers: Server[];
  currentServer: Server | null;
  currentChannel: Channel | null;
  currentDM: DirectChannel | null;
  directChannels: DirectChannel[];
  messages: Message[];
  
  // Voice & Call state
  currentVoiceChannel: Channel | null;
  voiceParticipants: VoiceParticipant[];
  channelVoiceStates: { channelId: string; participants: VoiceParticipant[] }[];
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  activeStageView: 'chat' | 'voice';
  pinnedStreamId: string | null;
  
  // Streams
  localScreenStream: MediaStream | null;
  localVideoStream: MediaStream | null;
  remoteStreams: { [socketId: string]: { cameraStream?: MediaStream; screenStream?: MediaStream } };

  // Direct Call state
  directCall: DirectCallState | null;

  // Modals
  isCreateServerOpen: boolean;
  isJoinServerOpen: boolean;
  isCreateChannelOpen: boolean;
  isUserSettingsOpen: boolean;
  selectedCategoryId: string | null;

  // Actions
  switchUser: (user: User) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  selectServer: (server: Server | null) => void;
  selectChannel: (channel: Channel) => void;
  selectDM: (dm: DirectChannel | null) => void;
  
  joinVoiceChannel: (channel: Channel) => Promise<void>;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  setActiveStageView: (view: 'chat' | 'voice') => void;
  setPinnedStreamId: (id: string | null) => void;

  sendMessage: (content: string, attachments?: any[]) => Promise<void>;
  sendDirectMessage: (content: string, attachments?: any[]) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;

  createServer: (name: string, icon?: string) => Promise<Server>;
  joinServer: (code: string) => Promise<boolean>;
  createChannel: (name: string, type: 'text' | 'voice', categoryId?: string, topic?: string) => Promise<Channel>;

  startDirectCall: (recipient: User) => void;
  acceptDirectCall: () => void;
  rejectDirectCall: () => void;
  endDirectCall: () => void;

  openCreateServerModal: () => void;
  closeCreateServerModal: () => void;
  openJoinServerModal: () => void;
  closeJoinServerModal: () => void;
  openCreateChannelModal: (categoryId?: string) => void;
  closeCreateChannelModal: () => void;
  openUserSettingsModal: () => void;
  closeUserSettingsModal: () => void;
}

const ConcordContext = createContext<ConcordContextType | null>(null);

export const ConcordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user_otavio',
    username: 'Otávio',
    discriminator: '0001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    custom_status: 'Codando o Concord 🚀'
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [currentDM, setCurrentDM] = useState<DirectChannel | null>(null);
  const [directChannels, setDirectChannels] = useState<DirectChannel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Voice & Video Call State
  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<Channel | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [channelVoiceStates, setChannelVoiceStates] = useState<{ channelId: string; participants: VoiceParticipant[] }[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeStageView, setActiveStageView] = useState<'chat' | 'voice'>('chat');
  const [pinnedStreamId, setPinnedStreamId] = useState<string | null>(null);

  // Streams
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [socketId: string]: { cameraStream?: MediaStream; screenStream?: MediaStream } }>({});

  // Direct Call State
  const [directCall, setDirectCall] = useState<DirectCallState | null>(null);

  // Modals
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isJoinServerOpen, setIsJoinServerOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const rtcManagerRef = useRef<WebRTCManager | null>(null);

  // Initialize WebRTC Manager
  useEffect(() => {
    rtcManagerRef.current = new WebRTCManager({
      onRemoteStream: (socketId, stream, streamType) => {
        setRemoteStreams(prev => {
          const userStreams = prev[socketId] || {};
          return {
            ...prev,
            [socketId]: {
              ...userStreams,
              [streamType === 'screen' ? 'screenStream' : 'cameraStream']: stream
            }
          };
        });
      },
      onRemoteStreamRemoved: (socketId, streamType) => {
        setRemoteStreams(prev => {
          const userStreams = prev[socketId];
          if (!userStreams) return prev;
          const updated = { ...userStreams };
          if (streamType === 'screen') delete updated.screenStream;
          else delete updated.cameraStream;
          return {
            ...prev,
            [socketId]: updated
          };
        });
      },
      onSpeakingChanged: (speaking) => {
        setIsSpeaking(speaking);
        if (currentVoiceChannel) {
          socket.emit('voice:state_change', { isSpeaking: speaking });
        }
      },
      onScreenShareEnded: () => {
        setIsScreenSharing(false);
        setLocalScreenStream(null);
        if (currentVoiceChannel) {
          socket.emit('voice:state_change', { isScreenSharing: false });
        }
      }
    });

    return () => {
      rtcManagerRef.current?.cleanupAll();
    };
  }, [currentVoiceChannel]);

  // Load initial data
  useEffect(() => {
    fetchUsers();
    fetchServers();
    fetchDirectChannels();
  }, [currentUser.id]);

  // Gateway Socket Registration
  useEffect(() => {
    socket.emit('identify', currentUser);

    const handlePresenceUpdated = (data: { userId: string; status: any; custom_status?: string }) => {
      setAllUsers(prev => prev.map(u => u.id === data.userId ? { ...u, status: data.status, custom_status: data.custom_status } : u));
    };

    const handleAllVoiceStates = (states: { channelId: string; participants: VoiceParticipant[] }[]) => {
      setChannelVoiceStates(states);
    };

    // Voice room events
    const handleRoomUsers = ({ channelId, users }: { channelId: string; users: VoiceParticipant[] }) => {
      setVoiceParticipants(users);
      // Initiate WebRTC peer connections to all existing room members
      for (const peer of users) {
        if (peer.socketId !== socket.id) {
          rtcManagerRef.current?.initiateCallToPeer(peer.socketId);
        }
      }
    };

    const handleUserJoinedVoice = (participant: VoiceParticipant) => {
      setVoiceParticipants(prev => {
        if (prev.some(p => p.socketId === participant.socketId)) return prev;
        return [...prev, participant];
      });
      audioFX.playJoin();
    };

    const handleUserLeftVoice = ({ socketId }: { socketId: string }) => {
      setVoiceParticipants(prev => prev.filter(p => p.socketId !== socketId));
      rtcManagerRef.current?.removePeer(socketId);
      audioFX.playLeave();
    };

    const handleUserStateChanged = ({ socketId, updates }: { socketId: string; updates: Partial<VoiceParticipant> }) => {
      setVoiceParticipants(prev => prev.map(p => p.socketId === socketId ? { ...p, ...updates } : p));
    };

    // Incoming messages
    const handleNewMessage = (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.author_id !== currentUser.id) {
        audioFX.playMessage();
      }
    };

    const handleReactionUpdated = (reactionData: any) => {
      setMessages(prev => prev.map(m => m.id === reactionData.message_id ? { ...m, reactions: reactionData.reactions } : m));
    };

    // DM messages
    const handleNewDirectMessage = ({ message }: { message: Message }) => {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.author_id !== currentUser.id) {
        audioFX.playMessage();
      }
    };

    // DM Call events
    const handleIncomingCall = ({ dmChannelId, caller }: { dmChannelId: string; caller: User }) => {
      setDirectCall({
        dmChannelId,
        caller,
        recipient: currentUser,
        status: 'incoming'
      });
      audioFX.startRingtone();
    };

    const handleCallAccepted = ({ dmChannelId, user }: { dmChannelId: string; user: User }) => {
      audioFX.stopRingtone();
      audioFX.playJoin();
      // Join voice room for DM
      joinVoiceChannel({
        id: dmChannelId,
        server_id: '',
        name: `Chamada com ${user.username}`,
        type: 'voice',
        position: 0,
        created_at: new Date().toISOString()
      });
    };

    const handleCallRejected = () => {
      audioFX.stopRingtone();
      setDirectCall(null);
    };

    const handleCallEnded = () => {
      audioFX.stopRingtone();
      setDirectCall(null);
      leaveVoiceChannel();
    };

    socket.on('user:presence_updated', handlePresenceUpdated);
    socket.on('voice:all_states', handleAllVoiceStates);
    socket.on('voice:room_users', handleRoomUsers);
    socket.on('voice:user_joined', handleUserJoinedVoice);
    socket.on('voice:user_left', handleUserLeftVoice);
    socket.on('voice:user_state_changed', handleUserStateChanged);
    socket.on('message:new', handleNewMessage);
    socket.on('message:reaction_updated', handleReactionUpdated);
    socket.on('dm:message:new', handleNewDirectMessage);
    socket.on('dm-call:incoming', handleIncomingCall);
    socket.on('dm-call:accepted', handleCallAccepted);
    socket.on('dm-call:rejected', handleCallRejected);
    socket.on('dm-call:ended', handleCallEnded);

    return () => {
      socket.off('user:presence_updated', handlePresenceUpdated);
      socket.off('voice:all_states', handleAllVoiceStates);
      socket.off('voice:room_users', handleRoomUsers);
      socket.off('voice:user_joined', handleUserJoinedVoice);
      socket.off('voice:user_left', handleUserLeftVoice);
      socket.off('voice:user_state_changed', handleUserStateChanged);
      socket.off('message:new', handleNewMessage);
      socket.off('message:reaction_updated', handleReactionUpdated);
      socket.off('dm:message:new', handleNewDirectMessage);
      socket.off('dm-call:incoming', handleIncomingCall);
      socket.off('dm-call:accepted', handleCallAccepted);
      socket.off('dm-call:rejected', handleCallRejected);
      socket.off('dm-call:ended', handleCallEnded);
    };
  }, [currentUser, currentVoiceChannel]);

  // Fetch functions
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const fetchServers = async () => {
    try {
      const res = await fetch(`/api/servers?userId=${currentUser.id}`);
      const data = await res.json();
      setServers(data);
      if (data.length > 0 && !currentServer && !currentDM) {
        // Default to first server
        selectServer(data[0]);
      }
    } catch (e) {
      console.error('Failed to fetch servers', e);
    }
  };

  const fetchDirectChannels = async () => {
    try {
      const res = await fetch(`/api/direct?userId=${currentUser.id}`);
      const data = await res.json();
      setDirectChannels(data);
    } catch (e) {
      console.error('Failed to fetch direct channels', e);
    }
  };

  const fetchChannelMessages = async (channelId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error('Failed to fetch channel messages', e);
    }
  };

  const fetchDMMessages = async (dmId: string) => {
    try {
      const res = await fetch(`/api/direct/${dmId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error('Failed to fetch DM messages', e);
    }
  };

  // Switch User
  const switchUser = (user: User) => {
    leaveVoiceChannel();
    setCurrentUser(user);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setCurrentUser(updated);
      setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      socket.emit('user:change_status', { userId: updated.id, status: updated.status, custom_status: updated.custom_status });
    } catch (e) {
      console.error('Failed to update user profile', e);
    }
  };

  // Navigation Selection
  const selectServer = async (server: Server | null) => {
    setCurrentServer(server);
    setCurrentDM(null);

    if (server) {
      try {
        const res = await fetch(`/api/servers/${server.id}`);
        const fullServer = await res.json();
        setCurrentServer(fullServer);

        // Auto select first text channel
        const firstTextChannel = fullServer.categories
          .flatMap((c: any) => c.channels)
          .find((ch: any) => ch.type === 'text');

        if (firstTextChannel) {
          selectChannel(firstTextChannel);
        }
      } catch (e) {
        console.error('Failed to load server details', e);
      }
    }
  };

  const selectChannel = (channel: Channel) => {
    if (currentChannel) {
      socket.emit('channel:leave', currentChannel.id);
    }
    setCurrentChannel(channel);
    setCurrentDM(null);
    if (channel.type === 'text') {
      setActiveStageView('chat');
      socket.emit('channel:join', channel.id);
      fetchChannelMessages(channel.id);
    } else if (channel.type === 'voice') {
      // Voice channel clicked: if not already connected, connect to it
      if (!currentVoiceChannel || currentVoiceChannel.id !== channel.id) {
        joinVoiceChannel(channel);
      }
      setActiveStageView('voice');
    }
  };

  const selectDM = (dm: DirectChannel | null) => {
    if (currentChannel) {
      socket.emit('channel:leave', currentChannel.id);
    }
    setCurrentServer(null);
    setCurrentChannel(null);
    setCurrentDM(dm);
    setActiveStageView('chat');

    if (dm) {
      socket.emit('dm:join', dm.id);
      fetchDMMessages(dm.id);
    }
  };

  // Voice & Video Actions
  const joinVoiceChannel = async (channel: Channel) => {
    if (currentVoiceChannel?.id === channel.id) {
      setActiveStageView('voice');
      return;
    }

    if (currentVoiceChannel) {
      leaveVoiceChannel();
    }

    setCurrentVoiceChannel(channel);
    setActiveStageView('voice');
    audioFX.playJoin();

    // Start local audio capture
    await rtcManagerRef.current?.startMicrophone();

    socket.emit('voice:join', {
      channelId: channel.id,
      user: currentUser,
      isMuted,
      isDeafened,
      isVideoOn,
      isScreenSharing
    });
  };

  const leaveVoiceChannel = () => {
    if (!currentVoiceChannel) return;
    audioFX.playLeave();

    rtcManagerRef.current?.cleanupAll();
    socket.emit('voice:leave');

    setCurrentVoiceChannel(null);
    setVoiceParticipants([]);
    setRemoteStreams({});
    setLocalScreenStream(null);
    setLocalVideoStream(null);
    setIsScreenSharing(false);
    setIsVideoOn(false);
    setActiveStageView('chat');
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    rtcManagerRef.current?.setMicrophoneMuted(nextMuted);
    if (nextMuted) audioFX.playMute();
    else audioFX.playUnmute();

    if (currentVoiceChannel) {
      socket.emit('voice:state_change', { isMuted: nextMuted });
    }
  };

  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);
    if (nextDeafened) {
      setIsMuted(true);
      rtcManagerRef.current?.setMicrophoneMuted(true);
      audioFX.playMute();
    } else {
      audioFX.playUnmute();
    }

    if (currentVoiceChannel) {
      socket.emit('voice:state_change', { isDeafened: nextDeafened, isMuted: nextDeafened ? true : isMuted });
    }
  };

  const toggleVideo = async () => {
    if (isVideoOn) {
      rtcManagerRef.current?.stopCamera();
      setIsVideoOn(false);
      setLocalVideoStream(null);
      if (currentVoiceChannel) {
        socket.emit('voice:state_change', { isVideoOn: false });
      }
    } else {
      const stream = await rtcManagerRef.current?.startCamera();
      if (stream) {
        setIsVideoOn(true);
        setLocalVideoStream(stream);
        if (currentVoiceChannel) {
          socket.emit('voice:state_change', { isVideoOn: true });
        }
      }
    }
  };

  // SCREEN SHARING TOGGLE
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      rtcManagerRef.current?.stopScreenShare();
      setIsScreenSharing(false);
      setLocalScreenStream(null);
      if (currentVoiceChannel) {
        socket.emit('voice:state_change', { isScreenSharing: false });
      }
    } else {
      const stream = await rtcManagerRef.current?.startScreenShare();
      if (stream) {
        setIsScreenSharing(true);
        setLocalScreenStream(stream);
        if (currentVoiceChannel) {
          socket.emit('voice:state_change', { isScreenSharing: true });
        }
      }
    }
  };

  // Chat Actions
  const sendMessage = async (content: string, attachments: any[] = []) => {
    if (!currentChannel) return;
    try {
      const res = await fetch(`/api/channels/${currentChannel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: currentUser.id,
          content,
          attachments
        })
      });
      const newMsg = await res.json();
      socket.emit('message:send', newMsg);
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  const sendDirectMessage = async (content: string, attachments: any[] = []) => {
    if (!currentDM) return;
    try {
      const res = await fetch(`/api/direct/${currentDM.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: currentUser.id,
          content,
          attachments
        })
      });
      const newMsg = await res.json();
      socket.emit('dm:message:send', { dmChannelId: currentDM.id, message: newMsg });
      fetchDirectChannels();
    } catch (e) {
      console.error('Failed to send DM', e);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          emoji
        })
      });
      const updatedMsg = await res.json();
      if (currentChannel) {
        socket.emit('message:reaction', { channel_id: currentChannel.id, message_id: messageId, reactions: updatedMsg.reactions });
      }
    } catch (e) {
      console.error('Failed to add reaction', e);
    }
  };

  // Server Management
  const createServer = async (name: string, icon?: string): Promise<Server> => {
    const res = await fetch('/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        icon,
        owner_id: currentUser.id
      })
    });
    const newServer = await res.json();
    setServers(prev => [...prev, newServer]);
    selectServer(newServer);
    closeCreateServerModal();
    return newServer;
  };

  const joinServer = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/servers/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: code,
          user_id: currentUser.id
        })
      });
      if (!res.ok) return false;
      const joinedServer = await res.json();
      setServers(prev => {
        if (prev.some(s => s.id === joinedServer.id)) return prev;
        return [...prev, joinedServer];
      });
      selectServer(joinedServer);
      closeJoinServerModal();
      return true;
    } catch (e) {
      console.error('Join server error', e);
      return false;
    }
  };

  const createChannel = async (name: string, type: 'text' | 'voice', categoryId?: string, topic?: string): Promise<Channel> => {
    if (!currentServer) throw new Error('Nenhum servidor selecionado');
    const res = await fetch(`/api/servers/${currentServer.id}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        category_id: categoryId,
        topic
      })
    });
    const newChannel = await res.json();
    // Refresh server
    selectServer(currentServer);
    closeCreateChannelModal();
    return newChannel;
  };

  // Direct Call Actions
  const startDirectCall = (recipient: User) => {
    if (!currentDM) return;
    setDirectCall({
      dmChannelId: currentDM.id,
      caller: currentUser,
      recipient,
      status: 'calling'
    });
    audioFX.startRingtone();
    socket.emit('dm-call:initiate', {
      dmChannelId: currentDM.id,
      caller: currentUser,
      recipientId: recipient.id
    });
  };

  const acceptDirectCall = () => {
    if (!directCall) return;
    audioFX.stopRingtone();
    socket.emit('dm-call:accept', {
      dmChannelId: directCall.dmChannelId,
      user: currentUser,
      callerId: directCall.caller.id
    });
    joinVoiceChannel({
      id: directCall.dmChannelId,
      server_id: '',
      name: `Chamada Privada com ${directCall.caller.username}`,
      type: 'voice',
      position: 0,
      created_at: new Date().toISOString()
    });
    setDirectCall(null);
  };

  const rejectDirectCall = () => {
    if (!directCall) return;
    audioFX.stopRingtone();
    socket.emit('dm-call:reject', {
      dmChannelId: directCall.dmChannelId,
      callerId: directCall.caller.id
    });
    setDirectCall(null);
  };

  const endDirectCall = () => {
    if (!directCall) return;
    audioFX.stopRingtone();
    socket.emit('dm-call:end', {
      dmChannelId: directCall.dmChannelId,
      recipientId: directCall.recipient.id === currentUser.id ? directCall.caller.id : directCall.recipient.id
    });
    setDirectCall(null);
    leaveVoiceChannel();
  };

  // Modal helpers
  const openCreateServerModal = () => setIsCreateServerOpen(true);
  const closeCreateServerModal = () => setIsCreateServerOpen(false);
  const openJoinServerModal = () => setIsJoinServerOpen(true);
  const closeJoinServerModal = () => setIsJoinServerOpen(false);
  const openCreateChannelModal = (categoryId?: string) => {
    setSelectedCategoryId(categoryId || null);
    setIsCreateChannelOpen(true);
  };
  const closeCreateChannelModal = () => {
    setIsCreateChannelOpen(false);
    setSelectedCategoryId(null);
  };
  const openUserSettingsModal = () => setIsUserSettingsOpen(true);
  const closeUserSettingsModal = () => setIsUserSettingsOpen(false);

  return (
    <ConcordContext.Provider
      value={{
        currentUser,
        allUsers,
        servers,
        currentServer,
        currentChannel,
        currentDM,
        directChannels,
        messages,
        currentVoiceChannel,
        voiceParticipants,
        channelVoiceStates,
        isMuted,
        isDeafened,
        isVideoOn,
        isScreenSharing,
        isSpeaking,
        activeStageView,
        pinnedStreamId,
        localScreenStream,
        localVideoStream,
        remoteStreams,
        directCall,
        isCreateServerOpen,
        isJoinServerOpen,
        isCreateChannelOpen,
        isUserSettingsOpen,
        selectedCategoryId,
        switchUser,
        updateUserProfile,
        selectServer,
        selectChannel,
        selectDM,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        toggleVideo,
        toggleScreenShare,
        setActiveStageView,
        setPinnedStreamId,
        sendMessage,
        sendDirectMessage,
        addReaction,
        createServer,
        joinServer,
        createChannel,
        startDirectCall,
        acceptDirectCall,
        rejectDirectCall,
        endDirectCall,
        openCreateServerModal,
        closeCreateServerModal,
        openJoinServerModal,
        closeJoinServerModal,
        openCreateChannelModal,
        closeCreateChannelModal,
        openUserSettingsModal,
        closeUserSettingsModal,
      }}
    >
      {children}
    </ConcordContext.Provider>
  );
};

export const useConcord = () => {
  const context = useContext(ConcordContext);
  if (!context) {
    throw new Error('useConcord must be used within a ConcordProvider');
  }
  return context;
};
