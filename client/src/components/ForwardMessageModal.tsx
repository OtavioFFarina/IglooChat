import React, { useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { X, Search, Hash, AtSign, Send, Check } from 'lucide-react';

export const ForwardMessageModal: React.FC = () => {
  const { 
    forwardTargetMessage, 
    closeForwardModal, 
    forwardMessage, 
    servers, 
    directChannels,
    friends 
  } = useIglooChat();

  const [search, setSearch] = useState('');
  const [forwardingTargetId, setForwardingTargetId] = useState<string | null>(null);

  if (!forwardTargetMessage) return null;

  // Flatten all text channels from all servers
  const allTextChannels: { serverName: string; serverIcon?: string; channel: any }[] = [];
  servers.forEach(server => {
    (server.categories || []).forEach(cat => {
      (cat.channels || []).forEach(ch => {
        if (ch.type === 'text') {
          allTextChannels.push({ serverName: server.name, serverIcon: server.icon, channel: ch });
        }
      });
    });
  });

  const filteredChannels = allTextChannels.filter(item => 
    item.channel.name.toLowerCase().includes(search.toLowerCase()) ||
    item.serverName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDMs = directChannels.filter(dm => 
    dm.recipient.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleForward = async (type: 'channel' | 'dm', id: string) => {
    setForwardingTargetId(id);
    await forwardMessage(type, id);
    setForwardingTargetId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-discord-dark border border-discord-floating rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-discord-floating flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">Encaminhar Mensagem</h3>
            <p className="text-discord-muted text-xs mt-0.5">Selecione onde deseja compartilhar esta mensagem</p>
          </div>
          <button
            onClick={closeForwardModal}
            className="p-1 rounded-lg hover:bg-white/10 text-discord-muted hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Snippet Preview */}
        <div className="mx-4 my-3 p-3 bg-discord-darkest rounded-xl border border-discord-floating text-xs">
          <div className="font-bold text-white mb-1 flex items-center space-x-1.5">
            <span className="text-discord-blurple">@</span>
            <span>{forwardTargetMessage.author?.username}</span>
          </div>
          <p className="text-discord-normal line-clamp-3 italic">
            "{forwardTargetMessage.content}"
          </p>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-discord-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar amigos ou canais..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-discord-darkest text-sm text-white pl-9 pr-3 py-2 rounded-lg border border-discord-floating focus:border-discord-blurple outline-none transition placeholder:text-discord-muted"
            />
          </div>
        </div>

        {/* Destination List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 scrollbar-thin">
          {/* Server Text Channels */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-discord-muted mb-1.5">
              Canais de Texto
            </div>
            {filteredChannels.length === 0 ? (
              <div className="text-xs text-discord-muted py-1">Nenhum canal encontrado</div>
            ) : (
              <div className="space-y-1">
                {filteredChannels.map(({ serverName, channel }) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-discord-darkhover transition"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Hash className="w-4 h-4 text-discord-muted flex-shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">#{channel.name}</div>
                        <div className="text-[10px] text-discord-muted truncate">{serverName}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleForward('channel', channel.id)}
                      disabled={forwardingTargetId === channel.id}
                      className="px-3 py-1 bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-medium rounded transition flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Enviar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-discord-muted mb-1.5">
              Mensagens Privadas
            </div>
            {filteredDMs.length === 0 ? (
              <div className="text-xs text-discord-muted py-1">Nenhuma conversa direta</div>
            ) : (
              <div className="space-y-1">
                {filteredDMs.map(dm => (
                  <div
                    key={dm.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-discord-darkhover transition"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <img
                        src={dm.recipient.avatar}
                        alt={dm.recipient.username}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="text-xs font-semibold text-white truncate">
                        {dm.recipient.username}
                      </div>
                    </div>
                    <button
                      onClick={() => handleForward('dm', dm.id)}
                      disabled={forwardingTargetId === dm.id}
                      className="px-3 py-1 bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-medium rounded transition flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Enviar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-discord-darker border-t border-discord-floating flex justify-end">
          <button
            onClick={closeForwardModal}
            className="px-4 py-1.5 rounded text-xs font-medium text-discord-normal hover:underline"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
