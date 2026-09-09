import React, { useEffect, useRef, useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { 
  Reply, 
  Edit3, 
  Copy, 
  Pin, 
  Share2, 
  Trash2, 
  Check, 
  Smile,
  Forward
} from 'lucide-react';
import { Message } from '../types';

interface MessageContextMenuProps {
  message: Message;
  position: { x: number; y: number };
  onClose: () => void;
  onStartEdit: (message: Message) => void;
}

const QUICK_REACTIONS = ['🔥', '❤️', '👍', '😂', '🚀', '💯'];

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  message,
  position,
  onClose,
  onStartEdit
}) => {
  const { 
    currentUser, 
    currentServer, 
    setReplyToMessage, 
    deleteMessage, 
    pinMessage, 
    addReaction,
    openForwardModal
  } = useIglooChat();

  const menuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const isAuthor = currentUser?.id === message.author_id;
  const isServerOwner = currentServer?.owner_id === currentUser?.id;
  const canDelete = isAuthor || isServerOwner;
  const canEdit = isAuthor;

  // Handle click outside & ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust position so it stays inside viewport
  const getAdjustedPosition = () => {
    const menuWidth = 220;
    const menuHeight = 310;
    let { x, y } = position;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    return { x: Math.max(10, x), y: Math.max(10, y) };
  };

  const pos = getAdjustedPosition();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  const handleReply = () => {
    setReplyToMessage(message);
    onClose();
  };

  const handleEdit = () => {
    onStartEdit(message);
    onClose();
  };

  const handleDelete = async () => {
    await deleteMessage(message.id);
    onClose();
  };

  const handlePin = async () => {
    await pinMessage(message.id);
    onClose();
  };

  const handleForward = () => {
    openForwardModal(message);
    onClose();
  };

  const handleReaction = async (emoji: string) => {
    await addReaction(message.id, emoji);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${pos.y}px`, left: `${pos.x}px` }}
      className="fixed z-50 w-56 bg-discord-floating border border-discord-darkhover rounded-xl shadow-2xl p-1.5 select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Quick Reactions Bar */}
      <div className="flex items-center justify-between px-1 py-1 mb-1 border-b border-discord-darkest">
        {QUICK_REACTIONS.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className="p-1.5 hover:bg-discord-darkhover rounded text-base hover:scale-125 transition active:scale-95"
            title={`Reagir com ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="space-y-0.5">
        {/* Reply */}
        <button
          onClick={handleReply}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-discord-normal hover:bg-discord-blurple hover:text-white rounded-lg transition"
        >
          <Reply className="w-4 h-4" />
          <span>Responder</span>
        </button>

        {/* Edit (if author) */}
        {canEdit && (
          <button
            onClick={handleEdit}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-discord-normal hover:bg-discord-darkhover hover:text-white rounded-lg transition"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Mensagem</span>
          </button>
        )}

        {/* Copy Text */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-discord-normal hover:bg-discord-darkhover hover:text-white rounded-lg transition"
        >
          <div className="flex items-center space-x-2.5">
            <Copy className="w-4 h-4" />
            <span>Copiar Texto</span>
          </div>
          {copied && <span className="text-[10px] text-discord-green font-bold">Copiado!</span>}
        </button>

        {/* Forward */}
        <button
          onClick={handleForward}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-discord-normal hover:bg-discord-darkhover hover:text-white rounded-lg transition"
        >
          <Forward className="w-4 h-4" />
          <span>Encaminhar Mensagem</span>
        </button>

        {/* Pin / Unpin */}
        <button
          onClick={handlePin}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-discord-normal hover:bg-discord-darkhover hover:text-white rounded-lg transition"
        >
          <Pin className="w-4 h-4" />
          <span>{message.is_pinned ? 'Desafixar Mensagem' : 'Fixar Mensagem'}</span>
        </button>

        {/* Delete (if author or server owner) */}
        {canDelete && (
          <>
            <div className="my-1 border-t border-discord-darkest" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-discord-red hover:bg-discord-red hover:text-white rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Mensagem</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
