import React, { useRef, useEffect, useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { 
  Hash, 
  Phone, 
  Video, 
  Users, 
  Smile, 
  Reply, 
  Trash2, 
  ExternalLink,
  Tv,
  Radio,
  Download
} from 'lucide-react';
import { MessageInput } from './MessageInput';
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
    setActiveStageView
  } = useConcord();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Simple Markdown Parser
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-[#1e1f22] px-1.5 py-0.5 rounded text-xs font-mono text-[#e6e6e6]">
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

  const QUICK_REACTIONS = ['🔥', '🚀', '❤️', '👍', '😂', '💯'];

  return (
    <main 
      aria-label="Área de Conversa"
      className="flex-1 h-full bg-discord-dark flex flex-col relative select-text overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="h-12 px-4 bg-discord-dark border-b border-[#1f2023] flex items-center justify-between flex-shrink-0 z-10 select-none shadow-sm">
        {/* Left: Channel Info */}
        <div className="flex items-center space-x-2 truncate">
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
                <div className="hidden md:flex items-center space-x-2 border-l border-[#3f4147] pl-3 ml-2 truncate">
                  <span className="text-xs text-discord-muted truncate">{currentChannel.topic}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="font-bold text-sm text-discord-header">Concord</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 text-discord-muted">
          {/* If inside DM, show Call Buttons */}
          {currentDM && (
            <>
              <button
                onClick={() => startDirectCall(currentDM.recipient)}
                title="Iniciar Chamada Privada (Voz, Vídeo & Tela)"
                className="p-1.5 rounded hover:bg-[#35373c] hover:text-discord-header transition flex items-center space-x-1"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden lg:inline text-xs font-semibold">Iniciar Chamada</span>
              </button>
            </>
          )}

          {/* If connected to a voice channel, button to switch to Voice Stage */}
          {currentVoiceChannel && (
            <button
              onClick={() => setActiveStageView('voice')}
              title="Abrir Palco de Voz & Compartilhamento de Tela"
              className="px-2.5 py-1 rounded bg-[#23a55a]/15 text-discord-green hover:bg-[#23a55a]/25 transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Ver Tela / Call</span>
            </button>
          )}

          {/* Member List Toggle */}
          {currentServer && (
            <button
              onClick={onToggleMemberList}
              title={isMemberListOpen ? 'Ocultar Lista de Membros' : 'Exibir Lista de Membros'}
              className={`p-1.5 rounded transition ${
                isMemberListOpen ? 'text-discord-header bg-[#35373c]' : 'hover:bg-[#35373c] hover:text-discord-header'
              }`}
            >
              <Users className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1e1f22]">
        {/* Welcome Channel Banner */}
        <div className="pt-6 pb-4 border-b border-[#2b2d31]">
          <div className="w-16 h-16 rounded-full bg-[#2b2d31] flex items-center justify-center text-discord-header mb-3">
            {currentDM ? <span className="text-3xl font-bold">@</span> : <Hash className="w-10 h-10" />}
          </div>
          <h2 className="text-2xl font-bold text-discord-header">
            {currentDM ? `Este é o início da sua conversa com ${currentDM.recipient.username}` : `Bem-vindo a #${currentChannel?.name}!`}
          </h2>
          <p className="text-xs text-discord-muted mt-1">
            {currentDM
              ? 'Converse por texto, envie anexos ou inicie uma chamada privada com compartilhamento de tela.'
              : currentChannel?.topic || 'Este é o início do canal. Envie mensagens, arquivos e reaja!'}
          </p>
        </div>

        {/* Message Items */}
        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isSameAuthor = prevMsg && prevMsg.author_id === msg.author_id;
          const isCloseInTime =
            prevMsg &&
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 300000;
          const isGrouped = isSameAuthor && isCloseInTime;

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
              className={`relative flex group -mx-4 px-4 py-1 hover:bg-discord-darkhover/40 transition rounded ${
                isGrouped ? 'mt-0.5' : 'mt-3'
              }`}
            >
              {/* Quick Hover Reaction Actions */}
              {hoveredMessageId === msg.id && (
                <div className="absolute right-4 -top-3.5 bg-[#2b2d31] border border-[#232428] rounded-md shadow-lg flex items-center px-1 py-0.5 z-20 space-x-1">
                  {QUICK_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(msg.id, emoji)}
                      className="p-1 hover:bg-[#35373c] rounded text-xs transition hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Avatar column */}
              {!isGrouped ? (
                <div className="mr-4 flex-shrink-0">
                  <img
                    src={msg.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={msg.author?.username}
                    className="w-10 h-10 rounded-full object-cover mt-0.5"
                  />
                </div>
              ) : (
                <div className="w-10 mr-4 text-[10px] text-discord-muted opacity-0 group-hover:opacity-100 text-right select-none pt-0.5">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* Message Content Body */}
              <div className="flex-1 min-w-0">
                {!isGrouped && (
                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-sm text-discord-header hover:underline cursor-pointer">
                      {msg.author?.username}
                    </span>
                    <span className="text-[11px] text-discord-muted">
                      {formatTimestamp(msg.created_at)}
                    </span>
                  </div>
                )}

                {/* Text */}
                {msg.content && (
                  <div className="text-sm text-discord-normal leading-relaxed break-words mt-0.5">
                    {renderFormattedContent(msg.content)}
                  </div>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {msg.attachments.map((att) => {
                      const isImage = att.type?.startsWith('image/') || att.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

                      if (isImage) {
                        return (
                          <div
                            key={att.id || att.url}
                            onClick={() => setPreviewImage(att.url)}
                            className="relative max-w-sm rounded-lg overflow-hidden border border-[#2b2d31] cursor-pointer group/img shadow-md hover:border-discord-blurple transition"
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
                          className="flex items-center space-x-2 bg-[#2b2d31] hover:bg-[#35373c] p-2.5 rounded-md border border-[#1e1f22] text-xs text-white transition max-w-xs"
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
                      const userReacted = r.users?.includes(currentUser.id);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => addReaction(msg.id, r.emoji)}
                          className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border text-xs transition ${
                            userReacted
                              ? 'bg-discord-blurple/20 border-discord-blurple text-discord-blurple'
                              : 'bg-[#2b2d31] border-transparent hover:bg-[#35373c] text-discord-normal'
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
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom */}
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

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={previewImage} alt="Preview" className="max-w-4xl max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}
    </main>
  );
};
