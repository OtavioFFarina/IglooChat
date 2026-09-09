import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { 
  Hash, 
  Phone, 
  PhoneOff,
  Video, 
  Users, 
  Smile, 
  Reply, 
  Trash2, 
  ExternalLink,
  Tv,
  Radio, 
  Monitor,
  MonitorOff,
  Download,
  Menu,
  Pin,
  MoreVertical,
  Check,
  X,
  Share2
} from 'lucide-react';
import { MessageInput } from './MessageInput';
import { MessageContextMenu } from './MessageContextMenu';
import { ForwardMessageModal } from './ForwardMessageModal';
import { Message, Attachment } from '../types';

export const ChatArea: React.FC<{ onToggleMemberList: () => void; isMemberListOpen: boolean }> = ({
  onToggleMemberList,
  isMemberListOpen
}) => {
  const {
    currentChannel,
    currentDM,
    currentServer,
    messages,
    sendMessage,
    sendDirectMessage,
    addReaction,
    currentUser,
    startDirectCall,
    currentVoiceChannel,
    setActiveStageView,
    toggleScreenShare,
    isScreenSharing,
    leaveVoiceChannel,
    openMessageContextMenu,
    messageContextMenu,
    closeMessageContextMenu,
    editMessage,
    replyToMessage,
    setReplyToMessage,
    forwardTargetMessage,
    appearanceSettings,
    toggleMobileNav,
    openDownloadModal
  } = useIglooChat();

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Inline message editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  // Auto scroll to bottom instantly when entering a channel or when messages arrive (no smooth scroll animation jumping up)
  useLayoutEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [currentChannel?.id, currentDM?.id, messages]);

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    if (isToday) {
      return `Hoje às ${hours}:${mins}`;
    }
    return `${d.toLocaleDateString('pt-BR')} ${hours}:${mins}`;
  };

  // Day separator helpers
  const isNewDay = (currentDateStr: string, prevDateStr?: string) => {
    if (!prevDateStr) return true;
    const d1 = new Date(currentDateStr);
    const d2 = new Date(prevDateStr);
    return d1.toDateString() !== d2.toDateString();
  };

  const formatDayDivider = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (d.toDateString() === now.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';

    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Font size class mapping
  const getFontSizeClass = () => {
    switch (appearanceSettings?.fontSize) {
      case 'small': return 'text-xs';
      case 'medium': return 'text-base';
      case 'large': return 'text-lg';
      case 'normal':
      default: return 'text-sm';
    }
  };

  // Discord Markdown & Mention Parser
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|@[a-zA-Z0-9_\u00C0-\u00FF-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-discord-darkest px-1.5 py-0.5 rounded text-xs font-mono text-discord-header">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-gray-200">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('@')) {
        const isBroadcast = ['@todos', '@everyone', '@aqui', '@here'].includes(part.toLowerCase());
        const isMe = currentUser && part.toLowerCase() === `@${currentUser.username.toLowerCase()}`;
        return (
          <span
            key={index}
            className={`px-1.5 py-0.5 rounded font-semibold text-xs transition cursor-pointer inline-flex items-center mx-0.5 ${
              isMe
                ? 'bg-discord-blurple text-white hover:bg-discord-blurple-hover shadow-sm'
                : isBroadcast
                ? 'bg-discord-blurple/25 text-[#949cf7] hover:bg-discord-blurple hover:text-white'
                : 'bg-discord-blurple/20 text-[#c9cdfb] hover:bg-discord-blurple hover:text-white'
            }`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (currentDM) {
      await sendDirectMessage(text, attachments);
    } else if (currentChannel) {
      await sendMessage(text, attachments);
    }
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) return;
    await editMessage(messageId, editingContent.trim());
    setEditingMessageId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const QUICK_REACTIONS = ['🔥', '🚀', '❤️', '👍', '😂', '💯'];

  const isCompact = appearanceSettings?.messageDisplay === 'compact';

  return (
    <main 
      aria-label="Área de Conversa"
      className="flex-1 h-full bg-discord-dark flex flex-col relative select-text overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="h-12 px-3 sm:px-4 bg-discord-dark border-b border-discord-darkest flex items-center justify-between flex-shrink-0 z-10 select-none shadow-sm">
        {/* Left: Mobile Drawer Trigger & Channel Info */}
        <div className="flex items-center space-x-2 truncate">
          {/* Hamburger Menu on Mobile */}
          <button
            onClick={toggleMobileNav}
            title="Abrir Menu de Servidores e Canais"
            className="md:hidden p-1.5 rounded hover:bg-discord-darkhover text-discord-header transition flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {currentDM ? (
            <div className="flex items-center space-x-2 truncate">
              <span className="text-xl font-bold text-discord-muted">@</span>
              <span className="font-bold text-sm text-discord-header truncate">{currentDM.recipient.username}</span>
              <span className="text-xs text-discord-muted hidden sm:inline truncate">
                {currentDM.recipient.custom_status || 'Chat Privado'}
              </span>
            </div>
          ) : currentChannel ? (
            <div className="flex items-center space-x-2 truncate">
              <Hash className="w-5 h-5 text-discord-muted flex-shrink-0" />
              <span className="font-bold text-sm text-discord-header truncate">{currentChannel.name}</span>
              {currentChannel.topic && (
                <div className="hidden lg:flex items-center space-x-2 border-l border-discord-floating pl-3 ml-2 truncate">
                  <span className="text-xs text-discord-muted truncate">{currentChannel.topic}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="font-bold text-sm text-discord-header">IglooChat</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-discord-muted">
          {/* Download Desktop App Button */}
          <button
            onClick={openDownloadModal}
            title="Baixar Aplicativo para PC ou Celular"
            className="p-1.5 rounded hover:bg-discord-darkhover hover:text-white transition flex items-center space-x-1 text-xs"
          >
            <Download className="w-4 h-4 text-discord-blurple" />
            <span className="hidden sm:inline font-semibold">Baixar App</span>
          </button>

          {/* If inside DM, show Call Button */}
          {currentDM && (
            <button
              onClick={() => startDirectCall(currentDM.recipient)}
              title="Iniciar Chamada Privada (Voz, Vídeo & Tela)"
              className="p-1.5 rounded hover:bg-discord-darkhover hover:text-discord-header transition flex items-center space-x-1"
            >
              <Phone className="w-4 h-4 text-discord-green" />
              <span className="hidden lg:inline text-xs font-semibold">Chamada</span>
            </button>
          )}

          {/* If connected to a voice channel, button to switch to Voice Stage */}
          {currentVoiceChannel && (
            <button
              onClick={() => setActiveStageView('voice')}
              title="Abrir Palco de Voz & Compartilhamento de Tela"
              className="px-2.5 py-1 rounded bg-[#23a55a]/15 text-discord-green hover:bg-[#23a55a]/25 transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Tela / Call</span>
            </button>
          )}

          {/* Member List Toggle */}
          {currentServer && (
            <button
              onClick={onToggleMemberList}
              title={isMemberListOpen ? 'Ocultar Lista de Membros' : 'Exibir Lista de Membros'}
              className={`p-1.5 rounded transition ${
                isMemberListOpen ? 'text-discord-header bg-discord-darkhover' : 'hover:bg-discord-darkhover hover:text-discord-header'
              }`}
            >
              <Users className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Active Voice Call Floating Banner (Quick Screen Share & Stage Access) */}
      {currentVoiceChannel && (
        <div className="bg-[#23a55a]/15 border-b border-[#23a55a]/30 px-3 py-2 flex items-center justify-between z-20 flex-shrink-0 animate-fadeIn">
          <div 
            onClick={() => setActiveStageView('voice')}
            className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0 group"
          >
            <span className="w-2 h-2 rounded-full bg-discord-green animate-pulse" />
            <div className="truncate">
              <span className="text-xs font-bold text-discord-green mr-1">Voz Conectada:</span>
              <span className="text-xs font-medium text-white group-hover:underline">{currentVoiceChannel.name}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {/* Quick Screen Share Toggle directly on mobile/desktop */}
            <button
              onClick={toggleScreenShare}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow-sm ${
                isScreenSharing
                  ? 'bg-discord-green text-white hover:bg-emerald-600'
                  : 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
              }`}
              title={isScreenSharing ? "Parar Compartilhamento de Tela" : "Compartilhar Tela"}
            >
              {isScreenSharing ? (
                <>
                  <MonitorOff className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Parar Tela</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Transmitir Tela</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveStageView('voice')}
              className="p-1.5 rounded-lg bg-discord-darker hover:bg-discord-darkhover text-discord-header text-xs font-semibold transition flex items-center space-x-1"
              title="Abrir Palco da Call"
            >
              <Tv className="w-3.5 h-3.5 text-discord-green" />
            </button>

            <button
              onClick={leaveVoiceChannel}
              className="p-1.5 rounded-lg bg-discord-darker hover:bg-discord-red/20 text-discord-muted hover:text-discord-red transition"
              title="Desconectar da Voz"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-2 scrollbar-thin scrollbar-thumb-discord-floating"
      >
        {/* Welcome Channel Banner */}
        <div className="pt-6 pb-4 border-b border-discord-floating">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-discord-darker flex items-center justify-center text-discord-header mb-3">
            {currentDM ? <span className="text-3xl font-bold">@</span> : <Hash className="w-8 h-8 sm:w-10 sm:h-10" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-discord-header">
            {currentDM ? `Este é o início da sua conversa com ${currentDM.recipient.username}` : `Bem-vindo a #${currentChannel?.name}!`}
          </h2>
          <p className="text-xs text-discord-muted mt-1">
            {currentDM
              ? 'Converse por texto, envie anexos ou inicie uma chamada privada com compartilhamento de tela.'
              : currentChannel?.topic || 'Este é o início do canal. Envie mensagens, arquivos e reaja!'}
          </p>
        </div>

        {/* Message Items with Day Separators */}
        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDaySeparator = isNewDay(msg.created_at, prevMsg?.created_at);

          const isSameAuthor = prevMsg && prevMsg.author_id === msg.author_id && !showDaySeparator;
          const isCloseInTime =
            prevMsg &&
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000;
          const isGrouped = !isCompact && isSameAuthor && isCloseInTime;

          const isMentioned = currentUser && msg.content && (
            msg.content.includes(`@${currentUser.username}`) ||
            msg.content.includes('@todos') ||
            msg.content.includes('@everyone') ||
            msg.content.includes('@aqui') ||
            msg.content.includes('@here')
          );

          const isBeingEdited = editingMessageId === msg.id;

          return (
            <React.Fragment key={msg.id}>
              {/* Day Divider */}
              {showDaySeparator && (
                <div className="relative my-4 flex items-center justify-center select-none">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-discord-floating" />
                  </div>
                  <span className="relative bg-discord-dark px-3 py-0.5 text-[11px] font-bold text-discord-muted rounded-full shadow-sm border border-discord-floating/30">
                    {formatDayDivider(msg.created_at)}
                  </span>
                </div>
              )}

              {/* Message Item */}
              <div
                id={`msg-${msg.id}`}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openMessageContextMenu(msg, e.clientX, e.clientY);
                }}
                className={`relative flex flex-col group -mx-2 sm:-mx-4 px-2 sm:px-4 py-1 transition-colors duration-200 rounded ${
                  isMentioned
                    ? 'bg-[#f0b232]/10 hover:bg-[#f0b232]/15 border-l-2 border-[#f0b232] pl-[10px] sm:pl-[14px]'
                    : 'hover:bg-discord-darkhover/40'
                } ${isGrouped ? 'mt-0.5' : 'mt-2'} ${msg.is_pinned ? 'bg-discord-blurple/5' : ''}`}
              >
                {/* Reply Reference Header (Discord spine line) */}
                {msg.reply_to && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetEl = document.getElementById(`msg-${msg.reply_to?.id}`);
                      if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetEl.classList.add('bg-discord-blurple/25');
                        setTimeout(() => targetEl.classList.remove('bg-discord-blurple/25'), 1400);
                      }
                    }}
                    className="flex items-center space-x-1.5 text-xs text-discord-muted mb-1 ml-9 sm:ml-10 cursor-pointer hover:text-white transition group/reply select-none"
                    title="Clique para ir até a mensagem original"
                  >
                    <div className="w-6 h-3 border-l-2 border-t-2 border-discord-muted/40 rounded-tl-md -ml-5 mr-1 flex-shrink-0" />
                    <img
                      src={msg.reply_to.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                    />
                    <span className="font-semibold text-discord-header group-hover/reply:underline flex-shrink-0">
                      @{msg.reply_to.author?.username || 'Usuário'}
                    </span>
                    <span className="truncate max-w-xs sm:max-w-md text-discord-muted opacity-80 group-hover/reply:opacity-100">
                      {msg.reply_to.content || 'Anexo'}
                    </span>
                  </div>
                )}

                <div className="flex w-full">
                  {/* Floating Quick Action Buttons on Hover */}
                  {hoveredMessageId === msg.id && !isBeingEdited && (
                    <div className="absolute right-2 sm:right-4 -top-3.5 bg-discord-darker border border-discord-floating rounded-md shadow-lg flex items-center px-1 py-0.5 z-20 space-x-1">
                      {QUICK_REACTIONS.slice(0, 4).map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(msg.id, emoji)}
                          className="p-1 hover:bg-discord-darkhover rounded text-xs transition hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        onClick={() => setReplyToMessage(msg)}
                        title="Responder"
                        className="p-1 hover:bg-discord-darkhover rounded text-discord-muted hover:text-white transition"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          openMessageContextMenu(msg, rect.right, rect.bottom);
                        }}
                        title="Mais opções (botão direito)"
                        className="p-1 hover:bg-discord-darkhover rounded text-discord-muted hover:text-white transition"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Compact Mode: Timestamp on Left */}
                  {isCompact ? (
                    <div className="w-12 mr-2 text-[11px] text-discord-muted text-right select-none pt-0.5 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ) : (
                    /* Cozy Mode: Avatar Column */
                    !isGrouped ? (
                      <div className="mr-3 sm:mr-4 flex-shrink-0">
                        <img
                          src={msg.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={msg.author?.username}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover mt-0.5 shadow-sm"
                        />
                      </div>
                    ) : (
                    <div className="w-9 sm:w-10 mr-3 sm:mr-4 text-[10px] text-discord-muted opacity-0 group-hover:opacity-100 text-right select-none pt-0.5 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )
                )}

                {/* Message Content Body */}
                <div className="flex-1 min-w-0">
                  {/* Pinned Badge */}
                  {msg.is_pinned && (
                    <div className="flex items-center space-x-1 text-[10px] text-discord-muted mb-0.5 font-semibold">
                      <Pin className="w-3 h-3 text-[#f0b232] fill-current" />
                      <span>Mensagem Fixada</span>
                    </div>
                  )}

                  {/* Header (Author + Timestamp) */}
                  {(!isGrouped || isCompact) && (
                    <div className="flex items-baseline space-x-2">
                      <span className="font-semibold text-sm text-discord-header hover:underline cursor-pointer">
                        {msg.author?.username}
                      </span>
                      {!isCompact && (
                        <span className="text-[11px] text-discord-muted">
                          {formatTimestamp(msg.created_at)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Inline Message Edit Mode */}
                  {isBeingEdited ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit(msg.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        rows={2}
                        className="w-full bg-discord-darkest text-sm text-white p-2.5 rounded-lg border border-discord-blurple focus:outline-none resize-none"
                      />
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-discord-muted">escape para <button onClick={handleCancelEdit} className="text-discord-blurple hover:underline">cancelar</button> • enter para <button onClick={() => handleSaveEdit(msg.id)} className="text-discord-blurple hover:underline">salvar</button></span>
                      </div>
                    </div>
                  ) : (
                    /* Normal Message Text */
                    msg.content && (
                      <div className={`${getFontSizeClass()} text-discord-normal leading-relaxed break-words mt-0.5`}>
                        {renderFormattedContent(msg.content)}
                        {msg.edited_at && (
                          <span className="text-[10px] text-discord-muted ml-1 select-none">
                            (editado)
                          </span>
                        )}
                      </div>
                    )
                  )}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-2">
                      {msg.attachments.map((att) => {
                        const isImage = att.type?.startsWith('image/') || att.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

                        if (isImage) {
                          return (
                            <div
                              key={att.id || att.url}
                              onClick={() => setPreviewImage(att.url)}
                              className="relative max-w-sm rounded-lg overflow-hidden border border-discord-floating cursor-pointer group/img shadow-md hover:border-discord-blurple transition"
                            >
                              <img src={att.url} alt={att.name} className="max-h-64 object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                                <ExternalLink className="w-6 h-6 text-white drop-shadow" />
                              </div>
                            </div>
                          );
                        }

                        return (
                          <a
                            key={att.id || att.url}
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center space-x-2 bg-discord-darker hover:bg-discord-darkhover p-2.5 rounded-md border border-discord-floating text-xs text-white transition max-w-xs"
                          >
                            <Download className="w-4 h-4 text-discord-blurple" />
                            <span className="truncate">{att.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Reactions Pill Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {msg.reactions.map((r) => {
                        const userReacted = Boolean(currentUser && r.users?.includes(currentUser.id));
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => addReaction(msg.id, r.emoji)}
                            className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border text-xs transition ${
                              userReacted
                                ? 'bg-discord-blurple/20 border-discord-blurple text-discord-blurple'
                                : 'bg-discord-darker border-discord-floating/40 hover:bg-discord-darkhover text-discord-normal'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="font-semibold text-[11px]">{r.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom */}
      <div className="relative">
        <MessageInput
          placeholder={
            currentDM
              ? `Conversar com @${currentDM.recipient.username}`
              : currentChannel
              ? `Conversar em #${currentChannel.name}`
              : 'Digite sua mensagem...'
          }
          onSend={handleSendMessage}
        />
      </div>

      {/* Message Right-Click Context Menu */}
      {messageContextMenu && (
        <MessageContextMenu
          message={messageContextMenu.message}
          position={{ x: messageContextMenu.x, y: messageContextMenu.y }}
          onClose={closeMessageContextMenu}
          onStartEdit={(m) => {
            setEditingMessageId(m.id);
            setEditingContent(m.content);
          }}
        />
      )}

      {/* Forward Message Modal */}
      {forwardTargetMessage && <ForwardMessageModal />}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <img src={previewImage} alt="Preview" className="max-w-4xl max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}
    </main>
  );
};
