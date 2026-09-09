import React, { useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { 
  Hash, 
  Volume2, 
  ChevronDown, 
  Plus, 
  Users, 
  Radio, 
  MicOff, 
  VolumeX, 
  Tv, 
  UserPlus, 
  Copy, 
  Check, 
  Search, 
  X,
  Settings,
  LogOut,
  Trash2
} from 'lucide-react';
import { UserControls } from './UserControls';
import { VoiceConnectionCard } from './VoiceConnectionCard';
import { ChannelContextMenu } from './ChannelContextMenu';

export const Sidebar: React.FC = () => {
  const {
    currentServer,
    currentChannel,
    currentDM,
    directChannels,
    selectChannel,
    selectDM,
    openCreateChannelModal,
    openServerSettings,
    deleteServer,
    leaveServer,
    friendRequests,
    joinVoiceChannel,
    currentVoiceChannel,
    channelVoiceStates,
    voiceParticipants,
    currentUser,
    isMuted,
    isDeafened,
    isScreenSharing,
    isSpeaking,
    allUsers,
    selectServer,
    openUserContextMenu,
    setActiveStageView,
    setIsMobileNavOpen,
    channelContextMenu,
    openChannelContextMenu,
    closeChannelContextMenu
  } = useIglooChat();

  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<{ [id: string]: boolean }>({});
  const [searchFriend, setSearchFriend] = useState('');

  const handleSelectChannel = (channel: any) => {
    selectChannel(channel);
    setIsMobileNavOpen(false);
  };

  const handleSelectDM = (dm: any) => {
    selectDM(dm);
    setIsMobileNavOpen(false);
  };

  const handleSelectFriends = () => {
    selectDM(null);
    setIsMobileNavOpen(false);
  };

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const copyInviteCode = () => {
    if (!currentServer) return;
    navigator.clipboard.writeText(currentServer.invite_code);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  // Build real-time map of users in each voice channel
  const getChannelUsers = (channelId: string) => {
    if (currentVoiceChannel?.id === channelId) {
      // Return active participants in current client's voice session (guaranteeing local user is included!)
      const list = [...voiceParticipants];
      if (currentUser && !list.some(p => p.user.id === currentUser.id)) {
        list.push({
          socketId: 'local',
          user: currentUser,
          channelId,
          isMuted,
          isDeafened,
          isVideoOn: false,
          isScreenSharing,
          isSpeaking
        });
      }
      return list.map(p => {
        if (currentUser && p.user.id === currentUser.id) {
          return {
            ...p,
            isMuted,
            isDeafened,
            isScreenSharing,
            isSpeaking
          };
        }
        return p;
      });
    }
    const state = channelVoiceStates.find(s => s.channelId === channelId);
    return state ? state.participants : [];
  };

  return (
    <aside 
      aria-label="Canais e Conversas"
      className="w-[calc(100vw-88px)] max-w-[240px] md:w-60 h-full bg-discord-darker flex flex-col flex-shrink-0 select-none border-r border-discord-darkest"
    >
      {/* ========================================================= */}
      {/* SERVER MODE */}
      {/* ========================================================= */}
      {currentServer ? (
        <>
          {/* Server Header Dropdown */}
          <div className="relative">
            <div className="flex items-center border-b border-discord-darkest">
              <button
                onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
                className="flex-1 h-12 px-3 sm:px-4 flex items-center justify-between hover:bg-discord-darkhover/50 transition text-discord-header font-bold text-sm shadow-sm min-w-0"
              >
                <span className="truncate">{currentServer.name}</span>
                <ChevronDown
                  className={`w-4 h-4 text-discord-muted transition-transform duration-200 ml-1 flex-shrink-0 ${
                    isServerMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="md:hidden p-2 mr-1.5 rounded hover:bg-white/10 text-discord-muted hover:text-white transition flex-shrink-0"
                title="Fechar menu"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Server Dropdown Popover */}
            {isServerMenuOpen && (
              <div className="absolute top-14 left-2 right-2 bg-discord-floating border border-discord-darkest rounded-lg p-1.5 shadow-2xl z-50 space-y-1">
                <button
                  onClick={() => {
                    copyInviteCode();
                    setIsServerMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-discord-blurple hover:bg-discord-blurple hover:text-white rounded transition"
                >
                  <span className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Convidar Pessoas</span>
                  </span>
                  {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    openCreateChannelModal();
                    setIsServerMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-medium text-discord-normal hover:bg-discord-darkhover hover:text-white rounded transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Canal</span>
                </button>

                <button
                  onClick={() => {
                    openServerSettings(currentServer);
                    setIsServerMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-medium text-discord-normal hover:bg-discord-darkhover hover:text-white rounded transition"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configurações do Servidor</span>
                </button>

                <div className="h-[1px] bg-discord-darkest my-1" />

                {currentServer.owner_id === currentUser?.id ? (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Tem certeza que deseja excluir permanentemente o servidor "${currentServer.name}"?`)) {
                        await deleteServer(currentServer.id);
                        setIsServerMenuOpen(false);
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-semibold text-discord-red hover:bg-discord-red hover:text-white rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Servidor</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Deseja realmente sair do servidor "${currentServer.name}"?`)) {
                        await leaveServer(currentServer.id);
                        setIsServerMenuOpen(false);
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-semibold text-discord-red hover:bg-discord-red hover:text-white rounded transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair do Servidor</span>
                  </button>
                )}

                <div className="px-2.5 py-1.5 bg-discord-darkest rounded text-[11px] text-discord-muted flex items-center justify-between">
                  <span>Código de Convite:</span>
                  <span className="font-mono font-bold text-discord-header bg-discord-darker px-1.5 py-0.5 rounded">
                    {currentServer.invite_code}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Server Channels Scroll Area */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-discord-floating">
            {currentServer.categories.map((category) => {
              const isCollapsed = !!collapsedCategories[category.id];

              return (
                <div key={category.id} className="space-y-0.5">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-1 py-1 group cursor-pointer text-[#949ba4] hover:text-discord-header">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center space-x-1 text-[11px] font-bold tracking-wider uppercase truncate"
                    >
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                      <span className="truncate">{category.name}</span>
                    </button>

                    <button
                      onClick={() => openCreateChannelModal(category.id)}
                      title="Criar Canal nesta Categoria"
                      className="opacity-0 group-hover:opacity-100 hover:text-white transition p-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Channels List */}
                  {!isCollapsed && (
                    <div className="space-y-[2px]">
                      {category.channels.map((channel) => {
                        const isTextActive = currentChannel?.id === channel.id;
                        const isVoiceConnected = currentVoiceChannel?.id === channel.id;
                        const connectedUsers = channel.type === 'voice' ? getChannelUsers(channel.id) : [];

                        if (channel.type === 'text') {
                          return (
                            <button
                              key={channel.id}
                              onClick={() => handleSelectChannel(channel)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                openChannelContextMenu(channel, e.clientX, e.clientY);
                              }}
                              className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-[4px] text-sm group transition ${
                                isTextActive
                                  ? 'bg-discord-darkhover text-white font-medium'
                                  : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-discord-normal'
                              }`}
                            >
                              <Hash className="w-4 h-4 flex-shrink-0 text-discord-muted group-hover:text-discord-normal" />
                              <span className="truncate">{channel.name}</span>
                            </button>
                          );
                        }

                        // Voice Channel Item
                        return (
                          <div key={channel.id} className="space-y-1">
                            <button
                              onClick={() => handleSelectChannel(channel)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                openChannelContextMenu(channel, e.clientX, e.clientY);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] text-sm group transition ${
                                isVoiceConnected
                                  ? 'bg-[#23a55a]/15 text-discord-green font-medium'
                                  : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-discord-normal'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <Volume2
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    isVoiceConnected ? 'text-discord-green' : 'text-discord-muted group-hover:text-discord-normal'
                                  }`}
                                />
                                <span className="truncate">{channel.name}</span>
                              </div>

                              {connectedUsers.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-discord-darkest text-discord-muted font-bold">
                                  {connectedUsers.length}
                                </span>
                              )}
                            </button>

                            {/* Connected Participants indented under voice channel */}
                            {connectedUsers.length > 0 && (
                              <div className="pl-6 space-y-1 py-0.5">
                                {connectedUsers.map((p) => {
                                  const isUserSpeaking = p.isSpeaking;

                                  return (
                                    <div
                                      key={p.socketId}
                                      onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openUserContextMenu(p.user, e.clientX, e.clientY);
                                      }}
                                      onClick={() => {
                                        if (currentVoiceChannel?.id === channel.id) {
                                          setActiveStageView('voice');
                                        } else {
                                          handleSelectChannel(channel);
                                        }
                                      }}
                                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-discord-darkhover/50 text-xs text-discord-normal hover:text-white cursor-pointer group transition-colors select-none"
                                      title="Clique para abrir palco • Botão direito para opções"
                                    >
                                      <div className="flex items-center space-x-2 truncate">
                                        <div className="relative flex-shrink-0">
                                          <img
                                            src={p.user.avatar}
                                            alt={p.user.username}
                                            className={`w-5 h-5 rounded-full object-cover transition-all ${
                                              isUserSpeaking ? 'ring-2 ring-discord-green scale-105 shadow-[0_0_8px_#23a55a]' : ''
                                            }`}
                                          />
                                        </div>
                                        <span className="truncate font-medium flex items-center space-x-1">
                                          <span>{p.user.username}</span>
                                          {currentUser && p.user.id === currentUser.id && (
                                            <span className="text-[10px] text-discord-muted font-normal">(Você)</span>
                                          )}
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-1.5 text-discord-muted flex-shrink-0">
                                        {p.isScreenSharing && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-discord-red text-white tracking-wider flex items-center space-x-0.5 animate-pulse shadow-sm">
                                            <Tv className="w-2.5 h-2.5" />
                                            <span>AO VIVO</span>
                                          </span>
                                        )}
                                        {p.isMuted && <MicOff className="w-3 h-3 text-discord-red" />}
                                        {p.isDeafened && <VolumeX className="w-3 h-3 text-discord-red" />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ========================================================= */
        /* DIRECT MESSAGES / HOME MODE */
        /* ========================================================= */
        <>
          {/* Search Button & Mobile Close Button */}
          <div className="p-2 sm:p-3 border-b border-discord-darkest flex items-center space-x-1.5">
            <button
              onClick={() => {}}
              className="flex-1 bg-discord-darkest text-discord-muted text-xs px-2.5 py-1.5 rounded flex items-center justify-between border border-discord-floating hover:border-discord-darkhover transition min-w-0"
            >
              <span className="truncate">Buscar amigos ou DMs</span>
              <Search className="w-3.5 h-3.5 flex-shrink-0 ml-1" />
            </button>
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="md:hidden p-1.5 rounded hover:bg-white/10 text-discord-muted hover:text-white transition flex-shrink-0"
              title="Fechar menu"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {/* Friends Tab Button */}
            <button
              onClick={handleSelectFriends}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[4px] text-sm font-medium transition ${
                currentDM === null
                  ? 'bg-discord-darkhover text-white'
                  : 'text-discord-normal hover:bg-discord-darkhover/50 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-discord-muted" />
                <span>Amigos</span>
              </div>
              {friendRequests?.incoming && friendRequests.incoming.length > 0 && (
                <span className="bg-discord-red text-white text-[11px] font-extrabold px-1.5 py-0.2 rounded-full shadow-sm">
                  {friendRequests.incoming.length}
                </span>
              )}
            </button>

            {/* Direct Messages List */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-discord-muted uppercase tracking-wider">
                <span>Mensagens Diretas</span>
              </div>

              {directChannels.map((dm) => {
                const isActive = currentDM?.id === dm.id;
                const statusColor =
                  dm.recipient.status === 'online'
                    ? 'bg-discord-green'
                    : dm.recipient.status === 'idle'
                    ? 'bg-discord-amber'
                    : dm.recipient.status === 'dnd'
                    ? 'bg-discord-red'
                    : 'bg-discord-gray';

                return (
                  <button
                    key={dm.id}
                    onClick={() => handleSelectDM(dm)}
                    className={`w-full flex items-center space-x-3 px-2 py-2 rounded-[4px] group transition ${
                      isActive
                        ? 'bg-discord-darkhover text-white'
                        : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-discord-normal'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={dm.recipient.avatar}
                        alt={dm.recipient.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-discord-darker ${statusColor}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium text-sm text-discord-header truncate">
                        {dm.recipient.username}
                      </div>
                      <div className="text-xs text-discord-muted truncate">
                        {dm.last_message?.content || dm.recipient.custom_status || 'Clique para conversar'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Voice Status Card when active */}
      <VoiceConnectionCard />

      {/* User Controls pinned at bottom */}
      <UserControls />

      {/* Channel Context Menu */}
      {channelContextMenu && (
        <ChannelContextMenu
          channel={channelContextMenu.channel}
          position={{ x: channelContextMenu.x, y: channelContextMenu.y }}
          onClose={closeChannelContextMenu}
        />
      )}
    </aside>
  );
};
