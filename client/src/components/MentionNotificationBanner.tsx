import React from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { AtSign, X, MessageSquare } from 'lucide-react';

export const MentionNotificationBanner: React.FC = () => {
  const { 
    mentionNotifications, 
    dismissMentionNotification, 
    servers, 
    selectServer, 
    selectChannel, 
    selectDM, 
    directChannels 
  } = useIglooChat();

  if (!mentionNotifications || mentionNotifications.length === 0) return null;

  const handleClick = (notif: typeof mentionNotifications[0]) => {
    if (notif.serverId) {
      const server = servers.find(s => s.id === notif.serverId);
      if (server) {
        selectServer(server);
        if (notif.channelId) {
          for (const cat of server.categories || []) {
            const ch = cat.channels.find(c => c.id === notif.channelId);
            if (ch) {
              selectChannel(ch);
              break;
            }
          }
        }
      }
    } else if (notif.dmId) {
      const dm = directChannels.find(d => d.id === notif.dmId);
      if (dm) {
        selectDM(dm);
      }
    }
    dismissMentionNotification(notif.id);
  };

  return (
    <div 
      aria-label="Notificações de Menção"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none max-w-lg w-full px-4"
    >
      {mentionNotifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => handleClick(notif)}
          className="pointer-events-auto w-full bg-discord-floating/95 hover:bg-discord-darkhover backdrop-blur-md border border-[#f0b232]/70 rounded-xl shadow-[0_10px_30px_rgba(240,178,50,0.25)] p-3 flex items-center space-x-3 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.99] animate-in fade-in slide-in-from-top-4 duration-300"
        >
          {/* Server Icon or DM Avatar */}
          <div className="relative flex-shrink-0">
            {notif.serverIcon ? (
              <img
                src={notif.serverIcon}
                alt="Servidor"
                className="w-10 h-10 rounded-xl object-cover border border-[#f0b232]/40"
              />
            ) : notif.author?.avatar ? (
              <img
                src={notif.author.avatar}
                alt={notif.author.username}
                className="w-10 h-10 rounded-full object-cover border border-[#f0b232]/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-discord-blurple flex items-center justify-center text-white font-bold">
                <AtSign className="w-5 h-5" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#f0b232] text-black flex items-center justify-center text-[10px] font-extrabold shadow">
              @
            </span>
          </div>

          {/* Content info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#f0b232] truncate">
              <span>{notif.serverName || 'Mensagem Privada'}</span>
              {notif.channelName && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-300">#{notif.channelName}</span>
                </>
              )}
            </div>
            <div className="text-xs text-discord-normal truncate mt-0.5">
              <span className="text-white font-bold">{notif.author?.username}</span>
              <span className="text-gray-400"> marcou você: </span>
              <span className="text-[#f5d070] font-medium italic">"{notif.message}"</span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissMentionNotification(notif.id);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-discord-muted hover:text-white transition flex-shrink-0"
            title="Fechar Notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
