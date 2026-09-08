import React, { useState, useEffect, useRef } from 'react';
import { useConcord } from '../context/ConcordContext';
import { User } from '../types';
import { 
  User as UserIcon, 
  AtSign, 
  MessageSquare, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  VideoOff, 
  UserPlus, 
  UserMinus, 
  Copy, 
  Check 
} from 'lucide-react';

interface UserContextMenuProps {
  user: User;
  position: { x: number; y: number };
  onClose: () => void;
}

export const UserContextMenu: React.FC<UserContextMenuProps> = ({ user, position, onClose }) => {
  const { 
    currentUser, 
    friends, 
    openDMWithUser, 
    startDirectCall, 
    removeFriend, 
    sendFriendRequest,
    userAudioSettings,
    setUserVolume,
    toggleUserMutedLocally,
    toggleUserVideoLocally,
    openProfileModal
  } = useConcord();

  const [copiedId, setCopiedId] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelf = currentUser?.id === user.id;
  const isFriend = friends.some(f => f.id === user.id);
  const settings = userAudioSettings[user.id] || { volume: 100, muted: false, videoDisabled: false };

  // Calculate position to prevent overflowing screen
  const menuWidth = 230;
  const menuHeight = 380;
  const left = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const top = Math.min(position.y, window.innerHeight - menuHeight - 10);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => {
      setCopiedId(false);
      onClose();
    }, 900);
  };

  const handleStartDM = () => {
    openDMWithUser(user.id);
    onClose();
  };

  const handleStartCall = () => {
    startDirectCall(user.id);
    onClose();
  };

  const handleMention = () => {
    // Dispatch a custom event or let MessageInput insert mention
    const chatInput = document.querySelector('textarea, input[placeholder*="Conversar em"]') as HTMLTextAreaElement | HTMLInputElement;
    if (chatInput) {
      chatInput.value = chatInput.value ? `${chatInput.value} @${user.username} ` : `@${user.username} `;
      chatInput.focus();
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    onClose();
  };

  const handleFriendAction = async () => {
    if (isFriend) {
      await removeFriend(user.id);
    } else {
      await sendFriendRequest(`${user.username}#${user.discriminator}`);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ left: Math.max(10, left), top: Math.max(10, top) }}
      className="fixed z-70 w-56 bg-[#111214] border border-[#232428] rounded-xl shadow-2xl p-1.5 text-xs text-[#dbdee1] select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Profile Peek */}
      <div className="flex items-center space-x-2.5 px-2 py-2 border-b border-[#1f2023] mb-1">
        <div className="relative">
          <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111214] ${
            user.status === 'online' ? 'bg-[#23a55a]' :
            user.status === 'idle' ? 'bg-[#f0b232]' :
            user.status === 'dnd' ? 'bg-[#f23f43]' : 'bg-[#80848e]'
          }`} />
        </div>
        <div className="truncate flex-1">
          <div className="font-bold text-white text-xs truncate">{user.username}</div>
          <div className="text-[10px] text-discord-muted truncate">#{user.discriminator}</div>
        </div>
      </div>

      {/* Option: Profile */}
      <button
        onClick={() => {
          if (openProfileModal) openProfileModal(user);
          onClose();
        }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-discord-blurple hover:text-white transition group text-left"
      >
        <span>Perfil</span>
        <UserIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
      </button>

      {!isSelf && (
        <>
          {/* Option: Mention */}
          <button
            onClick={handleMention}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-discord-blurple hover:text-white transition group text-left"
          >
            <span>Mencionar</span>
            <AtSign className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </button>

          {/* Option: Message */}
          <button
            onClick={handleStartDM}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-discord-blurple hover:text-white transition group text-left"
          >
            <span>Mensagem</span>
            <MessageSquare className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </button>

          {/* Option: Call */}
          <button
            onClick={handleStartCall}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-discord-blurple hover:text-white transition group text-left"
          >
            <span>Iniciar chamada</span>
            <PhoneCall className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </button>

          <div className="h-[1px] bg-[#1f2023] my-1" />

          {/* User Volume Slider (0% - 200%) */}
          <div className="px-2.5 py-2 space-y-1.5 bg-[#18191c] rounded-lg border border-[#1f2023] my-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-white">
              <span className="flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-discord-blurple" />
                <span>Volume do usuário</span>
              </span>
              <span className="text-[10px] font-mono text-discord-blurple bg-discord-blurple/10 px-1.5 py-0.5 rounded">
                {settings.volume}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={settings.volume}
              onChange={(e) => setUserVolume(user.id, parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#2b2d31] rounded-lg appearance-none cursor-pointer accent-discord-blurple"
            />
          </div>

          {/* Mute Locally Checkbox */}
          <label className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#1f2023] transition cursor-pointer text-left">
            <span className="flex items-center space-x-2">
              <VolumeX className="w-3.5 h-3.5 text-discord-red" />
              <span>Silenciar</span>
            </span>
            <input
              type="checkbox"
              checked={settings.muted}
              onChange={() => toggleUserMutedLocally(user.id)}
              className="rounded border-[#3f4147] bg-[#2b2d31] text-discord-red focus:ring-0 cursor-pointer"
            />
          </label>

          {/* Disable Video Locally Checkbox */}
          <label className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#1f2023] transition cursor-pointer text-left">
            <span className="flex items-center space-x-2">
              <VideoOff className="w-3.5 h-3.5 text-discord-muted" />
              <span>Desativar vídeo</span>
            </span>
            <input
              type="checkbox"
              checked={settings.videoDisabled}
              onChange={() => toggleUserVideoLocally(user.id)}
              className="rounded border-[#3f4147] bg-[#2b2d31] text-discord-blurple focus:ring-0 cursor-pointer"
            />
          </label>

          <div className="h-[1px] bg-[#1f2023] my-1" />

          {/* Add / Remove Friend */}
          <button
            onClick={handleFriendAction}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition group text-left ${
              isFriend 
                ? 'hover:bg-discord-red hover:text-white text-discord-red' 
                : 'hover:bg-discord-blurple hover:text-white'
            }`}
          >
            <span>{isFriend ? 'Desfazer amizade' : 'Adicionar Amigo'}</span>
            {isFriend ? (
              <UserMinus className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            ) : (
              <UserPlus className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            )}
          </button>
        </>
      )}

      <div className="h-[1px] bg-[#1f2023] my-1" />

      {/* Copy User ID */}
      <button
        onClick={handleCopyId}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#1f2023] transition text-discord-muted hover:text-white text-left"
      >
        <span>{copiedId ? 'Copiado!' : 'Copiar ID do usuário'}</span>
        {copiedId ? (
          <Check className="w-3.5 h-3.5 text-discord-green" />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-60" />
        )}
      </button>
    </div>
  );
};
