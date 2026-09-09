import React from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { User } from '../types';
import { X, Calendar, MessageSquare, PhoneCall, ShieldCheck } from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const { currentUser, openDMWithUser, startDirectCall } = useIglooChat();
  const isSelf = currentUser?.id === user.id;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Membro recente';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Membro recente';
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-discord-floating w-full max-w-sm rounded-2xl overflow-hidden border border-discord-darkhover shadow-2xl relative select-none">
        {/* Banner Top */}
        <div className="h-24 bg-gradient-to-r from-discord-blurple to-indigo-700 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="px-5 pb-5 relative -mt-10">
          <div className="relative inline-block">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover ring-8 ring-discord-floating shadow-xl"
            />
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-4 ring-discord-floating ${
                user.status === 'online' ? 'bg-discord-green' :
                user.status === 'idle' ? 'bg-discord-amber' :
                user.status === 'dnd' ? 'bg-discord-red' : 'bg-discord-gray'
              }`}
            />
          </div>

          {/* User Names */}
          <div className="mt-3 bg-discord-darkest p-4 rounded-xl border border-discord-floating space-y-3">
            <div>
              <h3 className="text-base font-bold text-white leading-tight flex items-center space-x-1.5">
                <span>{user.username}</span>
                <span className="text-discord-muted text-xs font-normal">#{user.discriminator}</span>
              </h3>
              {user.custom_status && (
                <p className="text-xs text-discord-header mt-1 italic">
                  "{user.custom_status}"
                </p>
              )}
            </div>

            <div className="h-[1px] bg-discord-floating" />

            {/* Account Info */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-discord-muted uppercase tracking-wider block">
                  MEMBRO DO IGLOOCHAT DESDE
                </span>
                <div className="flex items-center space-x-1.5 text-discord-normal mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-discord-blurple" />
                  <span>{formatDate(user.created_at)}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-discord-muted uppercase tracking-wider block">
                  STATUS DE CONEXÃO
                </span>
                <div className="flex items-center space-x-1.5 text-discord-normal mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-discord-green" />
                  <span className="capitalize">{user.status}</span>
                </div>
              </div>
            </div>

            {!isSelf && (
              <div className="pt-2 flex items-center space-x-2">
                <button
                  onClick={() => {
                    openDMWithUser(user.id);
                    onClose();
                  }}
                  className="flex-1 bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Mensagem</span>
                </button>

                <button
                  onClick={() => {
                    startDirectCall(user.id);
                    onClose();
                  }}
                  className="bg-discord-darker hover:bg-discord-darkhover text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 border border-discord-floating"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Ligar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
