export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  avatar_history?: string[];
  status: UserStatus;
  status_preference?: UserStatus;
  custom_status?: string;
  theme?: string;
  created_at?: string;
}

export interface FriendRequest {
  id: string;
  from_id: string;
  to_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user: User;
}

export interface ServerMember {
  server_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user: User;
}

export interface Channel {
  id: string;
  server_id: string;
  category_id?: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  position: number;
  created_at: string;
}

export interface Category {
  id: string;
  server_id: string;
  name: string;
  position: number;
  channels: Channel[];
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
  categories: Category[];
  members: ServerMember[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs
}

export interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  author: User;
  content: string;
  attachments?: Attachment[];
  reply_to_id?: string;
  reply_to?: Message;
  reactions?: Reaction[];
  is_pinned?: boolean;
  edited_at?: string;
  created_at: string;
}

export interface DirectChannel {
  id: string;
  recipient: User;
  last_message?: Message;
  updated_at: string;
}

export interface VoiceParticipant {
  socketId: string;
  user: User;
  channelId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  stream?: MediaStream;
  screenStream?: MediaStream;
}

export interface DirectCallState {
  dmChannelId: string;
  caller: User;
  recipient: User;
  status: 'idle' | 'calling' | 'incoming' | 'connected';
}

export interface UserAudioSetting {
  volume: number; // 0 to 200
  muted: boolean;
  videoDisabled: boolean;
}

export interface StreamAudioSetting {
  volume: number; // 0 to 200
  muted: boolean;
}

export interface UserContextMenuState {
  user: User;
  x: number;
  y: number;
}

export interface MessageContextMenuState {
  message: Message;
  x: number;
  y: number;
}

export interface AppearanceSettings {
  fontSize: 'small' | 'normal' | 'medium' | 'large';
  messageDisplay: 'cozy' | 'compact';
  theme: 'dark' | 'midnight' | 'igloochat' | 'blurple' | 'emerald' | 'crimson';
}

export interface MentionNotification {
  id: string;
  serverName?: string;
  serverIcon?: string;
  channelName?: string;
  author: User;
  message: string;
  channelId?: string;
  dmId?: string;
  serverId?: string;
}
