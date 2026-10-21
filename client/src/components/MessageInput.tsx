import React, { useState, useRef, useEffect } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { PlusCircle, Smile, Send, X, Image as ImageIcon, FileText, AtSign, Film } from 'lucide-react';
import { Attachment, User } from '../types';

interface MessageInputProps {
  placeholder: string;
  onSend: (content: string, attachments: Attachment[]) => Promise<void>;
}

const EMOJI_LIST = ['🔥', '🚀', '❤️', '👍', '😂', '🎉', '🎮', '💻', '✨', '⚡', '🤖', '👀', '💯', '👏'];

interface MentionOption {
  id: string;
  name: string;
  label: string;
  description?: string;
  isSpecial?: boolean;
  user?: User;
}

export const MessageInput: React.FC<MessageInputProps> = ({ placeholder, onSend }) => {
  const { currentServer, currentDM, allUsers, currentUser, replyToMessage, setReplyToMessage } = useIglooChat();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<{ id: string; url: string; preview: string }[]>([]);
  const [isSearchingGifs, setIsSearchingGifs] = useState(false);

  // Mention system state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);

  // Compute available users for mentions
  const candidateUsers: User[] = React.useMemo(() => {
    if (currentServer) {
      const serverUserIds = new Set(currentServer.members.map(m => m.user_id));
      return allUsers.filter(u => serverUserIds.has(u.id));
    }
    if (currentDM) {
      return [currentDM.recipient];
    }
    return allUsers;
  }, [currentServer, currentDM, allUsers]);

  // Special role broadcast mentions
  const broadcastMentions: MentionOption[] = [
    { id: 'todos', name: 'todos', label: '@todos', description: 'Notifica todas as pessoas neste canal', isSpecial: true },
    { id: 'everyone', name: 'everyone', label: '@everyone', description: 'Notifica todas as pessoas neste canal', isSpecial: true },
    { id: 'aqui', name: 'aqui', label: '@aqui', description: 'Notifica apenas os membros atualmente online', isSpecial: true },
    { id: 'here', name: 'here', label: '@here', description: 'Notifica apenas os membros atualmente online', isSpecial: true }
  ];

  // Filtered mention options based on query
  const mentionOptions: MentionOption[] = React.useMemo(() => {
    if (!showMentionMenu) return [];
    const q = mentionQuery.toLowerCase();

    const matchedBroadcasts = (currentServer ? broadcastMentions : []).filter(b =>
      b.name.toLowerCase().startsWith(q)
    );

    const matchedUsers: MentionOption[] = candidateUsers
      .filter(u => u.username.toLowerCase().includes(q))
      .map(u => ({
        id: u.id,
        name: u.username,
        label: `@${u.username}`,
        description: `#${u.discriminator}`,
        isSpecial: false,
        user: u
      }));

    return [...matchedBroadcasts, ...matchedUsers];
  }, [showMentionMenu, mentionQuery, candidateUsers, currentServer]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedMentionIndex >= mentionOptions.length) {
      setSelectedMentionIndex(0);
    }
  }, [mentionOptions.length]);

  const insertMention = (option: MentionOption) => {
    if (mentionStartIndex < 0) return;
    const before = content.slice(0, mentionStartIndex);
    const cursorPos = textareaRef.current?.selectionStart || content.length;
    const after = content.slice(cursorPos);
    const replacement = `@${option.name} `;
    const newContent = before + replacement + after;

    setContent(newContent);
    setShowMentionMenu(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = before.length + replacement.length;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && mentionOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(i => (i + 1) % mentionOptions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(i => (i - 1 + mentionOptions.length) % mentionOptions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionOptions[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionMenu(false);
        return;
      }
    }

    if (e.key === 'Escape' && replyToMessage) {
      e.preventDefault();
      setReplyToMessage(null);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    const cursorPos = (typeof e.target.selectionStart === 'number' && e.target.selectionStart > 0)
      ? e.target.selectionStart
      : val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\u00C0-\u00FF-]*)$/);

    if (match) {
      setMentionQuery(match[1]);
      setMentionStartIndex(match.index!);
      setShowMentionMenu(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || isUploading) return;
    const sendText = content;
    const sendAtts = [...attachments];
    setContent('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setShowMentionMenu(false);
    await onSend(sendText, sendAtts);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setAttachments(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          name: data.name,
          url: data.url,
          size: data.size,
          type: data.type
        }
      ]);
    } catch (err) {
      console.error('Falha no upload de arquivo', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let fileToUpload: File | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          fileToUpload = file;
          break;
        }
      }
    }

    if (fileToUpload) {
      // We found a file/image pasted, prevent default paste behavior (which does nothing for files in textarea)
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', fileToUpload);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        setAttachments(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            name: data.name,
            url: data.url,
            size: data.size,
            type: data.type
          }
        ]);
      } catch (err) {
        console.error('Falha no upload de arquivo colado', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const searchGifs = async (query: string) => {
    setGifQuery(query);
    if (!query.trim()) {
      setGifResults([]);
      return;
    }
    setIsSearchingGifs(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=Gc7131jiJuvI7IdN0HZ1D7nh0ow5BU6g&q=${encodeURIComponent(query)}&limit=12`);
      const data = await res.json();
      if (data.data) {
        setGifResults(data.data.map((r: any) => ({
          id: r.id,
          url: r.images.original.url,
          preview: r.images.fixed_height_small.url
        })));
      }
    } catch (e) {
      console.error('GIF search failed', e);
    } finally {
      setIsSearchingGifs(false);
    }
  };

  const sendGif = (url: string) => {
    onSend('', [{
      id: Math.random().toString(),
      name: 'gif.gif',
      url: url,
      size: 0,
      type: 'image/gif'
    }]);
    setShowGifPicker(false);
    setGifQuery('');
    setGifResults([]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-discord-dark flex-shrink-0 relative">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,application/pdf,text/*"
      />

      {/* Reply Preview Bar */}
      {replyToMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-discord-darker rounded-t-lg border border-b-0 border-discord-floating text-xs select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-discord-muted">Respondendo a</span>
            <span className="font-semibold text-discord-header truncate">
              @{replyToMessage.author?.username || 'Usuário'}
            </span>
            <span className="text-discord-muted truncate max-w-xs sm:max-w-md italic">
              "{replyToMessage.content}"
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyToMessage(null)}
            className="p-1 text-discord-muted hover:text-white rounded hover:bg-discord-darkhover transition flex-shrink-0"
            title="Cancelar resposta (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mention Autocomplete Popover */}
      {showMentionMenu && mentionOptions.length > 0 && (
        <div
          ref={mentionMenuRef}
          className="absolute bottom-full mb-2 left-4 right-4 bg-discord-darker border border-discord-floating rounded-lg shadow-2xl overflow-hidden z-50 max-h-64 flex flex-col"
        >
          <div className="px-3 py-1.5 bg-discord-darkest text-[11px] font-bold text-discord-muted uppercase tracking-wider border-b border-discord-floating flex items-center justify-between">
            <span>Membros e Menções</span>
            <span className="text-[10px] font-normal lowercase text-discord-muted">TAB ou ENTER para selecionar</span>
          </div>
          <div className="overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {mentionOptions.map((opt, index) => {
              const isSelected = index === selectedMentionIndex;
              return (
                <button
                  key={opt.id + opt.name}
                  onClick={() => insertMention(opt)}
                  onMouseEnter={() => setSelectedMentionIndex(index)}
                  className={`w-full text-left flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md transition ${
                    isSelected
                      ? 'bg-discord-blurple text-white font-medium'
                      : 'text-discord-header hover:bg-discord-darkhover'
                  }`}
                >
                  {opt.isSpecial ? (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-discord-darkest text-discord-blurple'
                    }`}>
                      <AtSign className="w-4 h-4" />
                    </div>
                  ) : opt.user ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={opt.user.avatar}
                        alt={opt.user.username}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-discord-darker ${
                        opt.user.status === 'online' ? 'bg-discord-green' :
                        opt.user.status === 'idle' ? 'bg-discord-amber' :
                        opt.user.status === 'dnd' ? 'bg-discord-red' : 'bg-discord-gray'
                      }`} />
                    </div>
                  ) : null}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-sm truncate">{opt.label}</span>
                      {opt.description && (
                        <span className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-discord-muted'}`}>
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-6 bg-discord-floating border border-discord-darkhover rounded-xl p-3 shadow-2xl z-50 w-64">
          <div className="text-xs font-bold text-discord-muted uppercase mb-2">Emojis IglooChat</div>
          <div className="grid grid-cols-7 gap-1.5 text-xl">
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="p-1 hover:bg-discord-darkhover rounded text-center transition hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GIF Picker Popover */}
      {showGifPicker && (
        <div className="absolute bottom-20 right-16 bg-discord-floating border border-discord-darkhover rounded-xl p-3 shadow-2xl z-50 w-80 flex flex-col max-h-96">
          <div className="text-xs font-bold text-discord-muted uppercase mb-2">Buscar GIFs</div>
          <input
            type="text"
            placeholder="Pesquisar Giphy..."
            value={gifQuery}
            onChange={(e) => searchGifs(e.target.value)}
            className="w-full bg-discord-darkest text-sm text-white px-3 py-2 rounded mb-3 border border-discord-darkhover focus:border-discord-blurple focus:outline-none"
            autoFocus
          />
          <div className="flex-1 overflow-y-auto scrollbar-thin grid grid-cols-2 gap-2 auto-rows-max content-start">
            {isSearchingGifs ? (
              <div className="col-span-2 text-center text-discord-muted text-sm py-4">Buscando...</div>
            ) : gifResults.length > 0 ? (
              gifResults.map(gif => (
                <button
                  key={gif.id}
                  onClick={() => sendGif(gif.url)}
                  className="rounded overflow-hidden hover:opacity-80 transition bg-discord-darkest h-24 flex items-center justify-center w-full"
                >
                  <img src={gif.preview} alt="GIF" className="w-full h-full object-cover" />
                </button>
              ))
            ) : gifQuery.trim() ? (
              <div className="col-span-2 text-center text-discord-muted text-sm py-4">Nenhum GIF encontrado</div>
            ) : (
              <div className="col-span-2 text-center text-discord-muted text-sm py-4">Digite para buscar</div>
            )}
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className={`bg-discord-input flex flex-col p-2.5 focus-within:ring-1 focus-within:ring-discord-blurple transition border border-transparent focus-within:border-discord-blurple/50 shadow-inner ${
        replyToMessage ? 'rounded-b-lg rounded-t-none' : 'rounded-lg'
      }`}>
        {/* Attachment Preview Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-discord-darker rounded-md">
            {attachments.map((att, idx) => (
              <div
                key={att.id}
                className="flex items-center space-x-2 bg-discord-darkest px-2.5 py-1.5 rounded text-xs text-white border border-discord-floating"
              >
                {att.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-discord-blurple" />
                ) : (
                  <FileText className="w-4 h-4 text-discord-muted" />
                )}
                <span className="max-w-[120px] truncate">{att.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="text-discord-muted hover:text-discord-red"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Enviar um arquivo ou imagem"
            className="text-discord-muted hover:text-white transition p-1 rounded-full hover:bg-discord-darkhover"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-discord-header placeholder-discord-muted text-sm resize-none focus:outline-none scrollbar-thin max-h-32"
          />

          {/* GIF Picker Button */}
          <button
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
            }}
            title="Adicionar GIF"
            className="text-discord-muted hover:text-white transition p-1 rounded-full hover:bg-discord-darkhover"
          >
            <Film className="w-5 h-5" />
          </button>

          {/* Emoji Picker Button */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
            }}
            title="Adicionar Emoji"
            className="text-discord-muted hover:text-white transition p-1 rounded-full hover:bg-discord-darkhover"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!content.trim() && attachments.length === 0}
            title="Enviar Mensagem"
            className={`p-1.5 rounded-full transition ${
              content.trim() || attachments.length > 0
                ? 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
                : 'text-discord-muted opacity-40 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
