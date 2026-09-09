import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  User, 
  Server, 
  Channel, 
  Message, 
  DirectChannel, 
  VoiceParticipant, 
  DirectCallState, 
  FriendRequest,
  UserAudioSetting,
  StreamAudioSetting,
  UserContextMenuState,
  MessageContextMenuState,
  AppearanceSettings,
  MentionNotification
} from '../types';
import { socket } from '../services/socket';
import { WebRTCManager, WebRTCCallbacks } from '../services/webrtc';
import { audioFX } from '../services/audioEffects';

interface IglooChatContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  allUsers: User[];
  servers: Server[];
  currentServer: Server | null;
  currentChannel: Channel | null;
  currentDM: DirectChannel | null;
  directChannels: DirectChannel[];
  messages: Message[];
  
  // Friends
  friends: User[];
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  fetchFriends: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (target: string) => Promise<{ success: boolean; error?: string; autoAccepted?: boolean }>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;

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

  // Watch Stream & Stream Audio
  watchingStreams: Record<string, boolean>;
  startWatchingStream: (socketId: string) => void;
  stopWatchingStream: (socketId: string) => void;
  isWatchingStream: (socketId: string) => boolean;
  streamAudioSettings: Record<string, StreamAudioSetting>;
  setStreamVolume: (socketId: string, volume: number) => void;
  toggleStreamMute: (socketId: string) => void;

  // Direct Call state
  directCall: DirectCallState | null;

  // Local User Audio Settings (Volume 0-200%, Local Mute, Local Video Disable)
  userAudioSettings: Record<string, UserAudioSetting>;
  setUserVolume: (userId: string, volume: number) => void;
  toggleUserMutedLocally: (userId: string) => void;
  toggleUserVideoLocally: (userId: string) => void;

  // Noise suppression & Mic Sensitivity
  isNoiseSuppressionEnabled: boolean;
  toggleNoiseSuppression: () => void;
  micSensitivity: number;
  setMicSensitivity: (val: number) => void;
  getMicLevel: () => number;

  // Channel Context Menu
  channelContextMenu: { channel: Channel; x: number; y: number } | null;
  openChannelContextMenu: (channel: Channel, x: number, y: number) => void;
  closeChannelContextMenu: () => void;
  updateChannel: (channelId: string, name: string, topic?: string) => Promise<boolean>;
  deleteChannel: (channelId: string) => Promise<boolean>;

  // User Context Menu
  userContextMenu: UserContextMenuState | null;
  openUserContextMenu: (user: User, x: number, y: number) => void;
  closeUserContextMenu: () => void;

  // Message Context Menu & Actions
  messageContextMenu: MessageContextMenuState | null;
  openMessageContextMenu: (msg: Message, x: number, y: number) => void;
  closeMessageContextMenu: () => void;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  pinMessage: (messageId: string) => Promise<boolean>;
  replyToMessage: Message | null;
  setReplyToMessage: (msg: Message | null) => void;
  forwardTargetMessage: Message | null;
  openForwardModal: (msg: Message) => void;
  closeForwardModal: () => void;
  forwardMessage: (targetType: 'channel' | 'dm', targetId: string) => Promise<boolean>;

  // Mention Notifications
  mentionNotifications: MentionNotification[];
  dismissMentionNotification: (id: string) => void;

  // Appearance Settings
  appearanceSettings: AppearanceSettings;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void;

  // Mobile Navigation Drawer
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;

  // Download App Modal
  isDownloadModalOpen: boolean;
  openDownloadModal: () => void;
  closeDownloadModal: () => void;

  // Profile modal
  profileModalUser: User | null;
  openProfileModal: (user: User) => void;
  closeProfileModal: () => void;

  // Modals
  isCreateServerOpen: boolean;
  isJoinServerOpen: boolean;
  isCreateChannelOpen: boolean;
  isUserSettingsOpen: boolean;
  isServerSettingsOpen: boolean;
  serverSettingsTarget: Server | null;
  selectedCategoryId: string | null;

  // Auth actions
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, username: string, password: string, avatar?: string) => Promise<string | null>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<boolean>;

  // Navigation actions
  selectServer: (server: Server | null) => void;
  selectChannel: (channel: Channel) => void;
  selectDM: (dm: DirectChannel | null) => void;
  openDMWithUser: (targetUserId: string) => Promise<DirectChannel | null>;
  
  // Voice & Video Actions
  joinVoiceChannel: (channel: Channel) => Promise<void>;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  setActiveStageView: (view: 'chat' | 'voice') => void;
  setPinnedStreamId: (id: string | null) => void;

  // Chat Actions
  sendMessage: (content: string, attachments?: any[]) => Promise<void>;
  sendDirectMessage: (content: string, attachments?: any[]) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;

  // Server Management
  createServer: (name: string, icon?: string) => Promise<Server>;
  joinServer: (code: string) => Promise<boolean>;
  updateServer: (serverId: string, data: { name?: string; icon?: string }) => Promise<boolean>;
  deleteServer: (serverId: string) => Promise<boolean>;
  leaveServer: (serverId: string) => Promise<boolean>;
  createChannel: (name: string, type: 'text' | 'voice', categoryId?: string, topic?: string) => Promise<Channel>;

  // Direct Calls
  startDirectCall: (recipient: User | string) => void;
  acceptDirectCall: () => void;
  rejectDirectCall: () => void;
  endDirectCall: () => void;

  // Modal Openers
  openCreateServerModal: () => void;
  closeCreateServerModal: () => void;
  openJoinServerModal: () => void;
  closeJoinServerModal: () => void;
  openCreateChannelModal: (categoryId?: string) => void;
  closeCreateChannelModal: () => void;
  openUserSettingsModal: () => void;
  closeUserSettingsModal: () => void;
  openServerSettings: (server: Server) => void;
  closeServerSettings: () => void;
}

const IglooChatContext = createContext<IglooChatContextType | null>(null);

export const IglooChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('igloochat_token'));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: []
  });

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

  // Local User Audio Settings (Volume 0-200%, Local Mute, Local Video Disable)
  const [userAudioSettings, setUserAudioSettings] = useState<Record<string, UserAudioSetting>>({});

  const setUserVolume = (userId: string, volume: number) => {
    setUserAudioSettings(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { muted: false, videoDisabled: false }),
        volume
      }
    }));
  };

  const toggleUserMutedLocally = (userId: string) => {
    setUserAudioSettings(prev => {
      const current = prev[userId] || { volume: 100, muted: false, videoDisabled: false };
      return {
        ...prev,
        [userId]: {
          ...current,
          muted: !current.muted
        }
      };
    });
  };

  const toggleUserVideoLocally = (userId: string) => {
    setUserAudioSettings(prev => {
      const current = prev[userId] || { volume: 100, muted: false, videoDisabled: false };
      return {
        ...prev,
        [userId]: {
          ...current,
          videoDisabled: !current.videoDisabled
        }
      };
    });
  };

  // Watching Streams (Screen Share opt-in/opt-out)
  const [watchingStreams, setWatchingStreams] = useState<Record<string, boolean>>({});

  const startWatchingStream = (socketId: string) => {
    setWatchingStreams(prev => ({ ...prev, [socketId]: true }));
    audioFX.playStreamJoin();
    if (currentVoiceChannelRef.current && currentUser) {
      socket.emit('stream:viewer_joined', {
        channelId: currentVoiceChannelRef.current.id,
        user: currentUser,
        streamOwnerSocketId: socketId
      });
    }
  };

  const stopWatchingStream = (socketId: string) => {
    setWatchingStreams(prev => ({ ...prev, [socketId]: false }));
    audioFX.playStreamLeave();
    if (currentVoiceChannelRef.current && currentUser) {
      socket.emit('stream:viewer_left', {
        channelId: currentVoiceChannelRef.current.id,
        user: currentUser,
        streamOwnerSocketId: socketId
      });
    }
  };

  const isWatchingStream = (socketId: string) => {
    return !!watchingStreams[socketId];
  };

  // Stream Audio Settings (Volume 0-200% & Mute)
  const [streamAudioSettings, setStreamAudioSettings] = useState<Record<string, StreamAudioSetting>>({});

  const setStreamVolume = (socketId: string, volume: number) => {
    setStreamAudioSettings(prev => ({
      ...prev,
      [socketId]: {
        ...(prev[socketId] || { muted: false }),
        volume
      }
    }));
  };

  const toggleStreamMute = (socketId: string) => {
    setStreamAudioSettings(prev => {
      const current = prev[socketId] || { volume: 100, muted: false };
      return {
        ...prev,
        [socketId]: {
          ...current,
          muted: !current.muted
        }
      };
    });
  };

  // Message Context Menu
  const [messageContextMenu, setMessageContextMenu] = useState<MessageContextMenuState | null>(null);

  const openMessageContextMenu = (msg: Message, x: number, y: number) => {
    setMessageContextMenu({ message: msg, x, y });
  };

  const closeMessageContextMenu = () => {
    setMessageContextMenu(null);
  };

  // Message Reply & Forward
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [forwardTargetMessage, setForwardTargetMessage] = useState<Message | null>(null);

  const openForwardModal = (msg: Message) => setForwardTargetMessage(msg);
  const closeForwardModal = () => setForwardTargetMessage(null);

  // Mention Notifications
  const [mentionNotifications, setMentionNotifications] = useState<MentionNotification[]>([]);

  const dismissMentionNotification = (id: string) => {
    setMentionNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Appearance Settings (Persisted in localStorage & Server Profile)
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(() => {
    try {
      const savedTheme = localStorage.getItem('igloochat_theme');
      const savedApp = localStorage.getItem('igloochat_appearance');
      if (savedApp) {
        const parsed = JSON.parse(savedApp);
        if (savedTheme) parsed.theme = savedTheme;
        if (parsed.theme) {
          document.documentElement.setAttribute('data-theme', parsed.theme);
        }
        return parsed;
      }
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        return {
          fontSize: 'normal',
          messageDisplay: 'cozy',
          theme: savedTheme as any
        };
      }
    } catch (e) {}
    return {
      fontSize: 'normal',
      messageDisplay: 'cozy',
      theme: 'dark'
    };
  });

  const updateAppearanceSettings = (updates: Partial<AppearanceSettings>) => {
    setAppearanceSettings(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('igloochat_appearance', JSON.stringify(next));
        if (next.theme) {
          localStorage.setItem('igloochat_theme', next.theme);
          document.documentElement.setAttribute('data-theme', next.theme);
        }
      } catch (e) {}
      return next;
    });

    // Also persist theme to user profile in backend if logged in
    if (updates.theme && currentUser?.id) {
      updateUserProfile({ theme: updates.theme }).catch(console.error);
    }
  };

  // Mobile Navigation Drawer
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const toggleMobileNav = () => setIsMobileNavOpen(prev => !prev);

  // Download App Modal
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const openDownloadModal = () => setIsDownloadModalOpen(true);
  const closeDownloadModal = () => setIsDownloadModalOpen(false);

  // Noise Suppression
  const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('igloochat_noise_suppression') !== 'false';
    } catch (e) {
      return true;
    }
  });

  const toggleNoiseSuppression = () => {
    const next = !isNoiseSuppressionEnabled;
    setIsNoiseSuppressionEnabled(next);
    rtcManagerRef.current?.setNoiseSuppression(next);
  };

  // Microphone Sensitivity (0-100 threshold)
  const [micSensitivity, setMicSensitivityState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('igloochat_mic_sensitivity');
      return saved !== null ? parseInt(saved, 10) : 40;
    } catch (e) {
      return 40;
    }
  });

  const setMicSensitivity = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setMicSensitivityState(clamped);
    rtcManagerRef.current?.setMicSensitivity(clamped);
  };

  const getMicLevel = () => {
    return rtcManagerRef.current ? rtcManagerRef.current.getCurrentMicLevel() : 0;
  };

  // Channel Context Menu
  const [channelContextMenu, setChannelContextMenu] = useState<{ channel: Channel; x: number; y: number } | null>(null);

  const openChannelContextMenu = (channel: Channel, x: number, y: number) => {
    setChannelContextMenu({ channel, x, y });
  };

  const closeChannelContextMenu = () => {
    setChannelContextMenu(null);
  };

  // User Context Menu
  const [userContextMenu, setUserContextMenu] = useState<UserContextMenuState | null>(null);

  const openUserContextMenu = (user: User, x: number, y: number) => {
    setUserContextMenu({ user, x, y });
  };

  const closeUserContextMenu = () => {
    setUserContextMenu(null);
  };

  // Profile Modal
  const [profileModalUser, setProfileModalUser] = useState<User | null>(null);

  const openProfileModal = (user: User) => {
    setProfileModalUser(user);
  };

  const closeProfileModal = () => {
    setProfileModalUser(null);
  };

  // Modals
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isJoinServerOpen, setIsJoinServerOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [serverSettingsTarget, setServerSettingsTarget] = useState<Server | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const rtcManagerRef = useRef<WebRTCManager | null>(null);
  const currentVoiceChannelRef = useRef<Channel | null>(null);
  currentVoiceChannelRef.current = currentVoiceChannel;
  const currentChannelRef = useRef<Channel | null>(null);
  currentChannelRef.current = currentChannel;
  const currentDMRef = useRef<DirectChannel | null>(null);
  currentDMRef.current = currentDM;

  // Helper for authenticated headers
  const getAuthHeaders = (): Record<string, string> => {
    const activeToken = token || localStorage.getItem('igloochat_token');
    return activeToken
      ? { Authorization: `Bearer ${activeToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  // Check existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('igloochat_token');
      if (!storedToken) {
        setIsLoadingAuth(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setToken(data.token);
          if (data.user?.theme) {
            setAppearanceSettings(prev => {
              const next = { ...prev, theme: data.user.theme };
              try {
                localStorage.setItem('igloochat_appearance', JSON.stringify(next));
                localStorage.setItem('igloochat_theme', data.user.theme);
              } catch (e) {}
              return next;
            });
            document.documentElement.setAttribute('data-theme', data.user.theme);
          }
        } else {
          localStorage.removeItem('igloochat_token');
          setCurrentUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Auth validation failed', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Persistent WebRTC Callbacks using Ref
  const callbacksRef = useRef<WebRTCCallbacks>({
    onRemoteStream: () => {},
    onRemoteStreamRemoved: () => {},
    onSpeakingChanged: () => {},
    onScreenShareEnded: () => {}
  });

  callbacksRef.current = {
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
      if (currentVoiceChannelRef.current) {
        socket.emit('voice:state_change', { isSpeaking: speaking });
      }
    },
    onScreenShareEnded: () => {
      setIsScreenSharing(false);
      setLocalScreenStream(null);
      if (currentVoiceChannelRef.current) {
        socket.emit('voice:state_change', { isScreenSharing: false });
      }
    }
  };

  // Initialize WebRTC Manager ONCE on Mount (Prevents destroying active streams!)
  useEffect(() => {
    rtcManagerRef.current = new WebRTCManager({
      onRemoteStream: (sId, st, type) => callbacksRef.current.onRemoteStream(sId, st, type),
      onRemoteStreamRemoved: (sId, type) => callbacksRef.current.onRemoteStreamRemoved(sId, type),
      onSpeakingChanged: (sp) => callbacksRef.current.onSpeakingChanged(sp),
      onScreenShareEnded: () => callbacksRef.current.onScreenShareEnded()
    });

    return () => {
      rtcManagerRef.current?.cleanupAll();
    };
  }, []);

  // Load servers, friends, and DMs when user is authenticated
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchFriends();
      fetchFriendRequests();
      fetchServers();
      fetchDirectChannels();
    }
  }, [currentUser?.id]);

  // Gateway Socket Registration & Event Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    socket.emit('identify', currentUser);

    const handlePresenceUpdated = (data: { userId: string; status: any; custom_status?: string }) => {
      setAllUsers(prev => prev.map(u => u.id === data.userId ? { ...u, status: data.status, custom_status: data.custom_status } : u));
      setFriends(prev => prev.map(u => u.id === data.userId ? { ...u, status: data.status, custom_status: data.custom_status } : u));
    };

    const handleAllVoiceStates = (states: { channelId: string; participants: VoiceParticipant[] }[]) => {
      setChannelVoiceStates(states);
    };

    const handleRoomUsers = ({ channelId, users }: { channelId: string; users: VoiceParticipant[] }) => {
      let merged = [...users];
      if (currentUser && !merged.some(u => u.user.id === currentUser.id)) {
        merged.push({
          socketId: socket.id || 'local',
          user: currentUser,
          channelId,
          isMuted,
          isDeafened,
          isVideoOn,
          isScreenSharing,
          isSpeaking: false
        });
      }
      setVoiceParticipants(merged);
      for (const peer of merged) {
        if (peer.socketId !== socket.id && peer.user.id !== currentUser.id) {
          rtcManagerRef.current?.initiateCallToPeer(peer.socketId);
        }
      }
    };

    const handleUserJoinedVoice = (participant: VoiceParticipant) => {
      setVoiceParticipants(prev => {
        if (prev.some(p => p.socketId === participant.socketId || p.user.id === participant.user.id)) return prev;
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
      if (updates.isScreenSharing === false) {
        setRemoteStreams(prev => {
          if (!prev[socketId]?.screenStream) return prev;
          const updated = { ...prev };
          delete updated[socketId].screenStream;
          return updated;
        });
        rtcManagerRef.current?.removeRemoteStream(socketId, 'screen');
        audioFX.playScreenShareStop();
      } else if (updates.isScreenSharing === true) {
        audioFX.playScreenShareStart();
      }
    };

    const handleNewMessage = (msg: Message) => {
      if (currentChannelRef.current && currentChannelRef.current.id === msg.channel_id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      if (msg.author_id !== currentUser.id) {
        const isMention = msg.content && (
          msg.content.includes(`@${currentUser.username}`) ||
          msg.content.includes('@todos') ||
          msg.content.includes('@everyone') ||
          msg.content.includes('@aqui') ||
          msg.content.includes('@here')
        );
        if (isMention) {
          audioFX.playMention();
          const notif: MentionNotification = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            serverName: currentServer?.name,
            serverIcon: currentServer?.icon,
            channelName: currentChannel?.name,
            author: msg.author,
            message: msg.content,
            channelId: msg.channel_id,
            serverId: currentServer?.id
          };
          setMentionNotifications(prev => [notif, ...prev.slice(0, 2)]);
          setTimeout(() => {
            setMentionNotifications(prev => prev.filter(n => n.id !== notif.id));
          }, 6000);
        } else {
          audioFX.playMessage();
        }
      }
    };

    const handleReactionUpdated = (reactionData: any) => {
      setMessages(prev => prev.map(m => m.id === reactionData.message_id ? { ...m, reactions: reactionData.reactions } : m));
    };

    const handleMessageUpdated = (updatedMsg: Message) => {
      setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const handleMessagePinned = (pinnedMsg: Message) => {
      setMessages(prev => prev.map(m => m.id === pinnedMsg.id ? pinnedMsg : m));
    };

    const handleNewDirectMessage = ({ message }: { message: Message }) => {
      if (currentDMRef.current && currentDMRef.current.id === message.channel_id) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
      fetchDirectChannels();
      if (message.author_id !== currentUser.id) {
        const isMention = message.content && (
          message.content.includes(`@${currentUser.username}`) ||
          message.content.includes('@todos') ||
          message.content.includes('@everyone') ||
          message.content.includes('@aqui') ||
          message.content.includes('@here')
        );
        if (isMention) {
          audioFX.playMention();
          const notif: MentionNotification = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            author: message.author,
            message: message.content,
            dmId: message.channel_id
          };
          setMentionNotifications(prev => [notif, ...prev.slice(0, 2)]);
          setTimeout(() => {
            setMentionNotifications(prev => prev.filter(n => n.id !== notif.id));
          }, 6000);
        } else {
          audioFX.playMessage();
        }
      }
    };

    const handleChannelUpdated = ({ channel }: { channel: Channel }) => {
      setCurrentServer(prev => {
        if (!prev || prev.id !== channel.server_id) return prev;
        return {
          ...prev,
          categories: prev.categories.map(cat => ({
            ...cat,
            channels: cat.channels.map(c => c.id === channel.id ? { ...c, ...channel } : c)
          }))
        };
      });
      if (currentChannelRef.current?.id === channel.id) {
        setCurrentChannel(prev => prev ? { ...prev, ...channel } : null);
      }
    };

    const handleChannelDeleted = ({ channelId }: { channelId: string }) => {
      setCurrentServer(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map(cat => ({
            ...cat,
            channels: cat.channels.filter(c => c.id !== channelId)
          }))
        };
      });
      if (currentChannelRef.current?.id === channelId) {
        setCurrentChannel(null);
      }
      if (currentVoiceChannelRef.current?.id === channelId) {
        leaveVoiceChannel();
      }
    };

    const handleStreamViewerJoined = ({ streamOwnerSocketId }: { streamOwnerSocketId: string }) => {
      if (socket.id === streamOwnerSocketId) {
        audioFX.playStreamJoin();
      }
    };

    const handleStreamViewerLeft = ({ streamOwnerSocketId }: { streamOwnerSocketId: string }) => {
      if (socket.id === streamOwnerSocketId) {
        audioFX.playStreamLeave();
      }
    };

    // Friends Real-Time Events
    const handleFriendRequestReceived = (req: FriendRequest) => {
      setFriendRequests(prev => ({
        ...prev,
        incoming: [...prev.incoming.filter(r => r.id !== req.id), req]
      }));
      audioFX.playMessage();
    };

    const handleFriendAdded = (newFriend: User) => {
      setFriends(prev => {
        if (prev.some(f => f.id === newFriend.id)) return prev;
        return [...prev, newFriend];
      });
      fetchFriendRequests();
    };

    const handleFriendRemoved = ({ friendId }: { friendId: string }) => {
      setFriends(prev => prev.filter(f => f.id !== friendId));
    };

    // Server Lifecycle Events
    const handleServerDeleted = ({ serverId }: { serverId: string }) => {
      setServers(prev => prev.filter(s => s.id !== serverId));
      if (currentServer?.id === serverId) {
        selectDM(null);
      }
    };

    const handleServerUpdated = ({ server }: { server: Server }) => {
      setServers(prev => prev.map(s => s.id === server.id ? server : s));
      if (currentServer?.id === server.id) {
        setCurrentServer(server);
      }
    };

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
    socket.on('message:updated', handleMessageUpdated);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:pinned', handleMessagePinned);
    socket.on('message:reaction_updated', handleReactionUpdated);
    socket.on('dm:message:new', handleNewDirectMessage);
    socket.on('friend:request_received', handleFriendRequestReceived);
    socket.on('friend:added', handleFriendAdded);
    socket.on('friend:removed', handleFriendRemoved);
    socket.on('server:deleted', handleServerDeleted);
    socket.on('server:updated', handleServerUpdated);
    socket.on('channel:updated', handleChannelUpdated);
    socket.on('channel:deleted', handleChannelDeleted);
    socket.on('stream:viewer_joined', handleStreamViewerJoined);
    socket.on('stream:viewer_left', handleStreamViewerLeft);
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
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:pinned', handleMessagePinned);
      socket.off('message:reaction_updated', handleReactionUpdated);
      socket.off('dm:message:new', handleNewDirectMessage);
      socket.off('friend:request_received', handleFriendRequestReceived);
      socket.off('friend:added', handleFriendAdded);
      socket.off('friend:removed', handleFriendRemoved);
      socket.off('server:deleted', handleServerDeleted);
      socket.off('server:updated', handleServerUpdated);
      socket.off('channel:updated', handleChannelUpdated);
      socket.off('channel:deleted', handleChannelDeleted);
      socket.off('stream:viewer_joined', handleStreamViewerJoined);
      socket.off('stream:viewer_left', handleStreamViewerLeft);
      socket.off('dm-call:incoming', handleIncomingCall);
      socket.off('dm-call:accepted', handleCallAccepted);
      socket.off('dm-call:rejected', handleCallRejected);
      socket.off('dm-call:ended', handleCallEnded);
    };
  }, [currentUser?.id, currentServer?.id]);

  // Auth Operations
  const register = async (email: string, username: string, password: string, avatar?: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, avatar })
      });
      const data = await res.json();
      if (!res.ok) return data.error || 'Falha ao registrar.';
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('igloochat_token', data.token);
      if (appearanceSettings.theme) {
        fetch(`/api/users/${data.user.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: appearanceSettings.theme })
        }).catch(console.error);
      }
      return null;
    } catch (err: any) {
      return err.message || 'Erro ao conectar ao servidor.';
    }
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return data.error || 'Falha ao fazer login.';
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem('igloochat_token', data.token);
      if (data.user?.theme) {
        setAppearanceSettings(prev => {
          const next = { ...prev, theme: data.user.theme };
          try {
            localStorage.setItem('igloochat_appearance', JSON.stringify(next));
            localStorage.setItem('igloochat_theme', data.user.theme);
          } catch (e) {}
          return next;
        });
        document.documentElement.setAttribute('data-theme', data.user.theme);
      }
      return null;
    } catch (err: any) {
      return err.message || 'Erro ao conectar ao servidor.';
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getAuthHeaders()
        });
      }
    } catch (e) {}
    leaveVoiceChannel();
    localStorage.removeItem('igloochat_token');
    setCurrentUser(null);
    setToken(null);
    setServers([]);
    setFriends([]);
    setFriendRequests({ incoming: [], outgoing: [] });
    setCurrentServer(null);
    setCurrentChannel(null);
    setCurrentDM(null);
    setMessages([]);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setCurrentUser(updated);
      setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setFriends(prev => prev.map(u => u.id === updated.id ? updated : u));
      socket.emit('user:change_status', { userId: updated.id, status: updated.status, custom_status: updated.custom_status });
    } catch (e) {
      console.error('Failed to update user profile', e);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Não autenticado.' };
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Erro ao alterar senha.' };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Falha de conexão.' };
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) return false;
      logout();
      return true;
    } catch (e) {
      console.error('Delete account error', e);
      return false;
    }
  };

  // Fetch API
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const fetchFriends = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/friends', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (e) {
      console.error('Failed to fetch friends', e);
    }
  };

  const fetchFriendRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/friends/requests', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFriendRequests(data);
      }
    } catch (e) {
      console.error('Failed to fetch friend requests', e);
    }
  };

  const sendFriendRequest = async (target: string): Promise<{ success: boolean; error?: string; autoAccepted?: boolean }> => {
    if (!currentUser) return { success: false, error: 'Não autenticado.' };
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ target })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || 'Erro ao enviar pedido.' };
      }
      if (data.autoAccepted) {
        await fetchFriends();
        socket.emit('friend:accepted', {
          fromUserId: currentUser.id,
          toUserId: data.friend.id,
          friendDataForFrom: data.friend,
          friendDataForTo: currentUser
        });
        return { success: true, autoAccepted: true };
      } else {
        await fetchFriendRequests();
        socket.emit('friend:request_sent', {
          targetUserId: data.target.id,
          request: data.request
        });
        return { success: true, autoAccepted: false };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Falha de comunicação.' };
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ requestId })
      });
      if (!res.ok) return false;
      const data = await res.json();
      await fetchFriends();
      await fetchFriendRequests();
      if (data.friend) {
        socket.emit('friend:accepted', {
          fromUserId: data.friend.id,
          toUserId: currentUser.id,
          friendDataForFrom: currentUser,
          friendDataForTo: data.friend
        });
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ requestId })
      });
      if (!res.ok) return false;
      await fetchFriendRequests();
      return true;
    } catch (e) {
      return false;
    }
  };

  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) return false;
      setFriends(prev => prev.filter(f => f.id !== friendId));
      socket.emit('friend:removed', {
        targetUserId: friendId,
        byUserId: currentUser.id
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const fetchServers = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/servers?userId=${currentUser.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setServers(data);
      if (data.length > 0 && !currentServer && !currentDM) {
        selectServer(data[0]);
      }
    } catch (e) {
      console.error('Failed to fetch servers', e);
    }
  };

  const fetchDirectChannels = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/direct?userId=${currentUser.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setDirectChannels(data);
    } catch (e) {
      console.error('Failed to fetch direct channels', e);
    }
  };

  const fetchChannelMessages = async (channelId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages`, { headers: getAuthHeaders() });
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error('Failed to fetch channel messages', e);
    }
  };

  const fetchDMMessages = async (dmId: string) => {
    try {
      const res = await fetch(`/api/direct/${dmId}/messages`, { headers: getAuthHeaders() });
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error('Failed to fetch DM messages', e);
    }
  };

  // Navigation Selection
  const selectServer = async (server: Server | null) => {
    setCurrentServer(server);
    setCurrentDM(null);

    if (server) {
      try {
        const res = await fetch(`/api/servers/${server.id}`, { headers: getAuthHeaders() });
        const fullServer = await res.json();
        setCurrentServer(fullServer);

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
    if (channel.type === 'text') {
      if (currentChannel) {
        socket.emit('channel:leave', currentChannel.id);
      }
      setCurrentChannel(channel);
      setActiveStageView('chat');
      socket.emit('channel:join', channel.id);
      fetchChannelMessages(channel.id);
    } else if (channel.type === 'voice') {
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

  const openDMWithUser = async (targetUserId: string): Promise<DirectChannel | null> => {
    if (!currentUser) return null;
    try {
      const res = await fetch('/api/direct', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user2_id: targetUserId })
      });
      if (res.ok) {
        const dm = await res.json();
        selectDM(dm);
        await fetchDirectChannels();
        return dm;
      }
    } catch (e) {
      console.error('Failed to open DM', e);
    }
    return null;
  };

  // Voice & Video Actions
  const joinVoiceChannel = async (channel: Channel) => {
    if (!currentUser) return;
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

    // Seed local user immediately so self is never missing in voice list
    const localParticipant: VoiceParticipant = {
      socketId: socket.id || 'local',
      user: currentUser,
      channelId: channel.id,
      isMuted,
      isDeafened,
      isVideoOn,
      isScreenSharing,
      isSpeaking: false
    };
    setVoiceParticipants([localParticipant]);

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
    if (!currentChannel || !currentUser) return;
    try {
      const res = await fetch(`/api/channels/${currentChannel.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          server_id: currentServer?.id,
          content,
          attachments,
          reply_to_id: replyToMessage?.id || null
        })
      });
      const newMsg = await res.json();
      socket.emit('message:send', newMsg);
      setReplyToMessage(null);
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  const sendDirectMessage = async (content: string, attachments: any[] = []) => {
    if (!currentDM || !currentUser) return;
    try {
      const res = await fetch(`/api/direct/${currentDM.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content,
          attachments,
          reply_to_id: replyToMessage?.id || null
        })
      });
      const newMsg = await res.json();
      socket.emit('dm:message:send', { dmChannelId: currentDM.id, message: newMsg });
      setMessages(prev => [...prev, newMsg]);
      setReplyToMessage(null);
    } catch (e) {
      console.error('Failed to send direct message', e);
    }
  };

  const editMessage = async (messageId: string, newContent: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: newContent })
      });
      if (res.ok) {
        const data = await res.json();
        socket.emit('message:edit', {
          channelId: data.message.channel_id,
          message: data.message,
          isDM: data.isDM
        });
        setMessages(prev => prev.map(m => m.id === messageId ? data.message : m));
        return true;
      }
    } catch (e) {
      console.error('Failed to edit message', e);
    }
    return false;
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        socket.emit('message:delete', {
          channelId: data.channelId,
          messageId: data.messageId,
          isDM: data.isDM
        });
        setMessages(prev => prev.filter(m => m.id !== messageId));
        return true;
      }
    } catch (e) {
      console.error('Failed to delete message', e);
    }
    return false;
  };

  const pinMessage = async (messageId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/messages/${messageId}/pin`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        socket.emit('message:pin', {
          channelId: data.message.channel_id,
          message: data.message,
          isDM: data.isDM
        });
        setMessages(prev => prev.map(m => m.id === messageId ? data.message : m));
        return true;
      }
    } catch (e) {
      console.error('Failed to pin message', e);
    }
    return false;
  };

  const forwardMessage = async (targetType: 'channel' | 'dm', targetId: string): Promise<boolean> => {
    if (!forwardTargetMessage) return false;
    try {
      const quoteHeader = `↪️ **Mensagem Encaminhada de @${forwardTargetMessage.author?.username || 'Usuário'}:**\n> ${forwardTargetMessage.content.replace(/\n/g, '\n> ')}`;
      if (targetType === 'dm') {
        const res = await fetch(`/api/direct/${targetId}/messages`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            content: quoteHeader,
            attachments: forwardTargetMessage.attachments || []
          })
        });
        if (res.ok) {
          const sent = await res.json();
          socket.emit('dm:message:send', { dmChannelId: targetId, message: sent });
          closeForwardModal();
          return true;
        }
      } else {
        const res = await fetch(`/api/channels/${targetId}/messages`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            content: quoteHeader,
            attachments: forwardTargetMessage.attachments || []
          })
        });
        if (res.ok) {
          const sent = await res.json();
          socket.emit('message:send', sent);
          closeForwardModal();
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to forward message', e);
    }
    return false;
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
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
    if (!currentUser) throw new Error('Usuário não autenticado');
    const res = await fetch('/api/servers', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        icon
      })
    });
    const newServer = await res.json();
    setServers(prev => [...prev, newServer]);
    selectServer(newServer);
    closeCreateServerModal();
    return newServer;
  };

  const joinServer = async (code: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/servers/join', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          invite_code: code
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

  const updateServer = async (serverId: string, data: { name?: string; icon?: string }): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/servers/${serverId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) return false;
      const updated = await res.json();
      setServers(prev => prev.map(s => s.id === serverId ? { ...s, ...updated } : s));
      if (currentServer?.id === serverId) {
        setCurrentServer(prev => prev ? { ...prev, ...updated } : null);
      }
      socket.emit('server:updated', { server: updated });
      return true;
    } catch (e) {
      console.error('Update server error', e);
      return false;
    }
  };

  const deleteServer = async (serverId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) return false;
      setServers(prev => prev.filter(s => s.id !== serverId));
      if (currentServer?.id === serverId) {
        selectDM(null);
      }
      closeServerSettings();
      socket.emit('server:deleted', { serverId });
      return true;
    } catch (e) {
      console.error('Delete server error', e);
      return false;
    }
  };

  const leaveServer = async (serverId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/servers/${serverId}/leave`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) return false;
      setServers(prev => prev.filter(s => s.id !== serverId));
      if (currentServer?.id === serverId) {
        selectDM(null);
      }
      return true;
    } catch (e) {
      console.error('Leave server error', e);
      return false;
    }
  };

  const createChannel = async (name: string, type: 'text' | 'voice', categoryId?: string, topic?: string): Promise<Channel> => {
    if (!currentServer) throw new Error('Nenhum servidor selecionado');
    const res = await fetch(`/api/servers/${currentServer.id}/channels`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        type,
        category_id: categoryId,
        topic
      })
    });
    const newChannel = await res.json();
    selectServer(currentServer);
    closeCreateChannelModal();
    return newChannel;
  };

  const updateChannel = async (channelId: string, name: string, topic?: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, topic })
      });
      if (!res.ok) return false;
      const updatedChannel = await res.json();
      setCurrentServer(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map(cat => ({
            ...cat,
            channels: cat.channels.map(c => c.id === channelId ? { ...c, ...updatedChannel } : c)
          }))
        };
      });
      if (currentChannel?.id === channelId) {
        setCurrentChannel(prev => prev ? { ...prev, ...updatedChannel } : null);
      }
      socket.emit('channel:updated', { channel: updatedChannel });
      return true;
    } catch (e) {
      console.error('Update channel error', e);
      return false;
    }
  };

  const deleteChannel = async (channelId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) return false;
      setCurrentServer(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: prev.categories.map(cat => ({
            ...cat,
            channels: cat.channels.filter(c => c.id !== channelId)
          }))
        };
      });
      if (currentChannel?.id === channelId) {
        const allChannels = currentServer?.categories.flatMap(cat => cat.channels) || [];
        const fallback = allChannels.find(c => c.id !== channelId && c.type === 'text') || null;
        setCurrentChannel(fallback);
      }
      if (currentVoiceChannel?.id === channelId) {
        leaveVoiceChannel();
      }
      socket.emit('channel:deleted', { channelId, server: currentServer });
      return true;
    } catch (e) {
      console.error('Delete channel error', e);
      return false;
    }
  };

  // Direct Call Actions
  const startDirectCall = (target: User | string) => {
    if (!currentUser) return;
    const recipient = typeof target === 'string'
      ? (allUsers.find(u => u.id === target) || friends.find(u => u.id === target))
      : target;
    if (!recipient) return;
    const dmId = currentDM ? currentDM.id : `dm_${[currentUser.id, recipient.id].sort().join('_')}`;
    setDirectCall({
      dmChannelId: dmId,
      caller: currentUser,
      recipient,
      status: 'calling'
    });
    audioFX.startRingtone();
    socket.emit('dm-call:initiate', {
      dmChannelId: dmId,
      caller: currentUser,
      recipientId: recipient.id
    });
  };

  const acceptDirectCall = () => {
    if (!directCall || !currentUser) return;
    audioFX.stopRingtone();
    socket.emit('dm-call:accept', {
      dmChannelId: directCall.dmChannelId,
      user: currentUser,
      callerId: directCall.caller.id
    });
    joinVoiceChannel({
      id: directCall.dmChannelId,
      server_id: '',
      name: `Chamada com ${directCall.caller.username}`,
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
    if (!directCall || !currentUser) return;
    audioFX.stopRingtone();
    socket.emit('dm-call:end', {
      dmChannelId: directCall.dmChannelId,
      recipientId: directCall.recipient.id === currentUser.id ? directCall.caller.id : directCall.recipient.id
    });
    setDirectCall(null);
    leaveVoiceChannel();
  };

  // Modal openers
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
  const openServerSettings = (server: Server) => {
    setServerSettingsTarget(server);
    setIsServerSettingsOpen(true);
  };
  const closeServerSettings = () => {
    setIsServerSettingsOpen(false);
    setServerSettingsTarget(null);
  };

  return (
    <IglooChatContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        isLoadingAuth,
        allUsers,
        friends,
        friendRequests,
        fetchFriends,
        fetchFriendRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
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
        isServerSettingsOpen,
        serverSettingsTarget,
        selectedCategoryId,
        login,
        register,
        logout,
        updateUserProfile,
        changePassword,
        deleteAccount,
        selectServer,
        selectChannel,
        selectDM,
        openDMWithUser,
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
        updateServer,
        deleteServer,
        leaveServer,
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
        openServerSettings,
        closeServerSettings,
        userAudioSettings,
        setUserVolume,
        toggleUserMutedLocally,
        toggleUserVideoLocally,
        isNoiseSuppressionEnabled,
        toggleNoiseSuppression,
        userContextMenu,
        openUserContextMenu,
        closeUserContextMenu,
        messageContextMenu,
        openMessageContextMenu,
        closeMessageContextMenu,
        editMessage,
        deleteMessage,
        pinMessage,
        replyToMessage,
        setReplyToMessage,
        forwardTargetMessage,
        openForwardModal,
        closeForwardModal,
        forwardMessage,
        watchingStreams,
        startWatchingStream,
        stopWatchingStream,
        isWatchingStream,
        streamAudioSettings,
        setStreamVolume,
        toggleStreamMute,
        mentionNotifications,
        dismissMentionNotification,
        appearanceSettings,
        updateAppearanceSettings,
        isMobileNavOpen,
        setIsMobileNavOpen,
        toggleMobileNav,
        isDownloadModalOpen,
        openDownloadModal,
        closeDownloadModal,
        updateChannel,
        deleteChannel,
        channelContextMenu,
        openChannelContextMenu,
        closeChannelContextMenu,
        micSensitivity,
        setMicSensitivity,
        getMicLevel,
        profileModalUser,
        openProfileModal,
        closeProfileModal
      }}
    >
      {children}
    </IglooChatContext.Provider>
  );
};

export const useIglooChat = () => {
  const context = useContext(IglooChatContext);
  if (!context) {
    throw new Error('useIglooChat deve ser usado dentro de um IglooChatProvider');
  }
  return context;
};
