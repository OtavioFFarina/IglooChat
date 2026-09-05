import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { User } from '../types';
import { MessageSquare, Phone, Users, UserPlus } from 'lucide-react';

export const DirectMessagesView: React.FC = () => {
  const {
    allUsers,
    currentUser,
    selectDM,
    startDirectCall
  } = useConcord();

  const [tab, setTab] = useState<'online' | 'all' | 'add'>('online');

  // Friends excluding self
  const friends = allUsers.filter(u => u.id !== currentUser.id);
  const onlineFriends = friends.filter(u => u.status !== 'offline');

  const activeList = tab === 'online' ? onlineFriends : friends;

  const startDMWith = async (targetUser: User) => {
    try {
      const res = await fetch('/api/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1_id: currentUser.id,
          user2_id: targetUser.id
        })
      });
      const dm = await res.json();
      selectDM(dm);
    } catch (e) {
      console.error('Failed to open DM', e);
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online': return 'bg-discord-green';
      case 'idle': return 'bg-discord-amber';
      case 'dnd': return 'bg-discord-red';
      default: return 'bg-discord-gray';
    }
  };

  return (
    <div className="flex-1 h-full bg-discord-dark flex flex-col select-none">
      {/* Top Friends Header Bar */}
      <div className="h-12 px-4 bg-discord-dark border-b border-[#1f2023] flex items-center space-x-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-2 pr-4 border-r border-[#3f4147] text-discord-header font-bold text-sm">
          <Users className="w-5 h-5 text-discord-muted" />
          <span>Amigos</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setTab('online')}
            className={`px-3 py-1 rounded font-medium transition ${
              tab === 'online' ? 'bg-[#35373c] text-white' : 'text-discord-muted hover:bg-[#35373c]/50 hover:text-white'
            }`}
          >
            Disponível ({onlineFriends.length})
          </button>

          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1 rounded font-medium transition ${
              tab === 'all' ? 'bg-[#35373c] text-white' : 'text-discord-muted hover:bg-[#35373c]/50 hover:text-white'
            }`}
          >
            Todos ({friends.length})
          </button>

          <button
            onClick={() => setTab('add')}
            className={`px-3 py-1 rounded font-semibold transition ${
              tab === 'add' ? 'bg-discord-green text-white' : 'text-discord-green hover:bg-discord-green/10'
            }`}
          >
            Adicionar Amigo
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {tab === 'add' ? (
          <div className="max-w-xl space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              Adicionar Amigo no Concord
            </h3>
            <p className="text-xs text-discord-muted">
              Você pode adicionar amigos usando a tag deles ou simplesmente clicando nos membros da comunidade.
            </p>
            <div className="bg-[#1e1f22] p-3 rounded-lg flex items-center border border-[#2b2d31] focus-within:border-discord-blurple">
              <input
                type="text"
                placeholder="Você pode adicionar amigos pelo nome#0000"
                className="bg-transparent flex-1 text-sm text-white focus:outline-none placeholder-discord-muted"
              />
              <button className="bg-discord-blurple text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-discord-blurple-hover transition">
                Enviar Pedido de Amizade
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-bold text-discord-muted uppercase tracking-wider mb-2">
              {tab === 'online' ? `Disponível — ${onlineFriends.length}` : `Todos os Amigos — ${friends.length}`}
            </div>

            <div className="space-y-1">
              {activeList.map(friend => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#35373c]/50 border-t border-[#2b2d31]/50 group transition"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="relative flex-shrink-0">
                      <img src={friend.avatar} alt={friend.username} className="w-10 h-10 rounded-full object-cover" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-dark ${getStatusDot(friend.status)}`} />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-sm text-discord-header flex items-center space-x-1">
                        <span>{friend.username}</span>
                        <span className="text-xs text-discord-muted opacity-0 group-hover:opacity-100 transition">#{friend.discriminator}</span>
                      </div>
                      <div className="text-xs text-discord-muted truncate">
                        {friend.custom_status || (friend.status === 'online' ? 'Online no Concord' : 'Indisponível')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startDMWith(friend)}
                      title="Abrir Chat Privado"
                      className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#35373c] text-discord-normal hover:text-white transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={async () => {
                        await startDMWith(friend);
                        startDirectCall(friend);
                      }}
                      title="Iniciar Chamada Privada com Tela"
                      className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#35373c] text-discord-green hover:text-white transition"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
