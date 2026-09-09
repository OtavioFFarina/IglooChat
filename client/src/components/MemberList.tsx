import React, { useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { User } from '../types';
import { MessageSquare, Phone, UserPlus } from 'lucide-react';

export const MemberList: React.FC = () => {
  const {
    currentServer,
    allUsers,
    currentUser,
    friends,
    sendFriendRequest,
    openDMWithUser,
    startDirectCall,
    openUserContextMenu
  } = useIglooChat();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [friendStatusMsg, setFriendStatusMsg] = useState<string | null>(null);

  if (!currentServer) return null;

  // Filter members belonging to this server
  const serverUserIds = new Set(currentServer.members.map(m => m.user_id));
  const serverUsers = allUsers.filter(u => serverUserIds.has(u.id));

  const onlineMembers = serverUsers.filter(u => u.status !== 'offline');
  const offlineMembers = serverUsers.filter(u => u.status === 'offline');

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online': return 'bg-discord-green';
      case 'idle': return 'bg-discord-amber';
      case 'dnd': return 'bg-discord-red';
      default: return 'bg-discord-gray';
    }
  };

  const startDMWithUser = async (user: User) => {
    if (!currentUser) return;
    await openDMWithUser(user.id);
    setSelectedUser(null);
  };

  return (
    <aside 
      aria-label="Lista de Membros"
      className="w-60 h-full bg-discord-darker hidden lg:flex flex-col flex-shrink-0 select-none border-l border-discord-darkest p-3 overflow-y-auto scrollbar-thin relative"
    >
      {/* Online Section */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5 px-2">
          Disponível — {onlineMembers.length}
        </div>
        <div className="space-y-0.5">
          {onlineMembers.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
              onContextMenu={(e) => {
                e.preventDefault();
                openUserContextMenu(user, e.clientX, e.clientY);
              }}
              className="w-full flex items-center space-x-2.5 px-2 py-1.5 rounded hover:bg-discord-darkhover text-left group transition"
            >
              <div className="relative flex-shrink-0">
                <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-discord-darker ${getStatusDot(user.status)}`} />
              </div>
              <div className="truncate flex-1 min-w-0">
                <div className="font-medium text-sm text-discord-normal group-hover:text-white truncate">
                  {user.username}
                </div>
                {user.custom_status && (
                  <div className="text-[11px] text-discord-muted truncate">{user.custom_status}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Offline Section */}
      {offlineMembers.length > 0 && (
        <div>
          <div className="text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5 px-2">
            Indisponível — {offlineMembers.length}
          </div>
          <div className="space-y-0.5 opacity-60">
            {offlineMembers.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openUserContextMenu(user, e.clientX, e.clientY);
                }}
                className="w-full flex items-center space-x-2.5 px-2 py-1.5 rounded hover:bg-discord-darkhover text-left group transition"
              >
                <div className="relative flex-shrink-0">
                  <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover grayscale" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-discord-darker ${getStatusDot(user.status)}`} />
                </div>
                <div className="truncate flex-1 min-w-0">
                  <div className="font-medium text-sm text-discord-normal group-hover:text-white truncate">
                    {user.username}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User Profile Popover Modal */}
      {selectedUser && (
        <div className="absolute right-64 top-12 w-64 bg-discord-floating border border-discord-darkhover rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="h-14 -mx-4 -mt-4 bg-discord-blurple rounded-t-xl mb-3 relative">
            <div className="absolute -bottom-4 left-4">
              <div className="relative">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.username}
                  className="w-14 h-14 rounded-full border-4 border-discord-floating object-cover"
                />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-discord-floating ${getStatusDot(selectedUser.status)}`} />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="font-bold text-base text-white">{selectedUser.username}</div>
            <div className="text-xs text-discord-muted">#{selectedUser.discriminator}</div>
            {selectedUser.custom_status && (
              <div className="text-xs text-discord-normal mt-2 bg-discord-darkest p-2 rounded border border-discord-floating">
                {selectedUser.custom_status}
              </div>
            )}

            {currentUser && selectedUser.id !== currentUser.id && (
              <div className="mt-4 space-y-2">
                {!friends.some(f => f.id === selectedUser.id) && (
                  <button
                    onClick={async () => {
                      const res = await sendFriendRequest(`${selectedUser.username}#${selectedUser.discriminator}`);
                      if (res.success) {
                        setFriendStatusMsg(res.autoAccepted ? 'Agora são amigos!' : 'Pedido enviado!');
                      } else {
                        setFriendStatusMsg(res.error || 'Erro ao enviar');
                      }
                      setTimeout(() => setFriendStatusMsg(null), 3000);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-discord-darker hover:bg-discord-darkhover border border-discord-floating text-white py-1.5 px-3 rounded text-xs font-semibold transition"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-discord-green" />
                    <span>{friendStatusMsg || 'Adicionar Amigo'}</span>
                  </button>
                )}

                <button
                  onClick={() => startDMWithUser(selectedUser)}
                  className="w-full flex items-center justify-center space-x-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white py-1.5 px-3 rounded text-xs font-semibold transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Enviar Mensagem</span>
                </button>

                <button
                  onClick={() => {
                    startDirectCall(selectedUser);
                    setSelectedUser(null);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-discord-green hover:bg-emerald-600 text-white py-1.5 px-3 rounded text-xs font-semibold transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Iniciar Chamada de Vídeo/Tela</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
