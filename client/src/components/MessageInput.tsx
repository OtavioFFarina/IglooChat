import React, { useState, useRef } from 'react';
import { useConcord } from '../context/ConcordContext';
import { PlusCircle, Smile, Send, X, Image as ImageIcon, FileText } from 'lucide-react';
import { Attachment } from '../types';

interface MessageInputProps {
  placeholder: string;
  onSend: (content: string, attachments: Attachment[]) => Promise<void>;
}

const EMOJI_LIST = ['🔥', '🚀', '❤️', '👍', '😂', '🎉', '🎮', '💻', '✨', '⚡', '🤖', '👀', '💯', '👏'];

export const MessageInput: React.FC<MessageInputProps> = ({ placeholder, onSend }) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || isUploading) return;
    const sendText = content;
    const sendAtts = [...attachments];
    setContent('');
    setAttachments([]);
    setShowEmojiPicker(false);
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

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
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

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-6 bg-[#111214] border border-[#2b2d31] rounded-xl p-3 shadow-2xl z-50 w-64">
          <div className="text-xs font-bold text-discord-muted uppercase mb-2">Emojis Concord</div>
          <div className="grid grid-cols-7 gap-1.5 text-xl">
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="p-1 hover:bg-[#35373c] rounded text-center transition hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className="bg-discord-input rounded-lg flex flex-col p-2.5 focus-within:ring-1 focus-within:ring-discord-blurple transition border border-transparent focus-within:border-discord-blurple/50 shadow-inner">
        {/* Attachment Preview Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#2b2d31] rounded-md">
            {attachments.map((att, idx) => (
              <div
                key={att.id}
                className="flex items-center space-x-2 bg-[#1e1f22] px-2.5 py-1.5 rounded text-xs text-white border border-[#35373c]"
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
            className="text-discord-muted hover:text-white transition p-1 rounded-full hover:bg-[#2b2d31]"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-discord-header placeholder-discord-muted text-sm resize-none focus:outline-none scrollbar-thin max-h-32"
          />

          {/* Emoji Picker Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Adicionar Emoji"
            className="text-discord-muted hover:text-white transition p-1 rounded-full hover:bg-[#2b2d31]"
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
