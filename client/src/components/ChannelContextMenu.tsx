import React, { useState, useEffect, useRef } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { Channel } from '../types';
import { 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Hash, 
  Volume2, 
  X 
} from 'lucide-react';

interface ChannelContextMenuProps {
  channel: Channel;
  position: { x: number; y: number };
  onClose: () => void;
}

export const ChannelContextMenu: React.FC<ChannelContextMenuProps> = ({ channel, position, onClose }) => {
  const { currentServer, currentUser, updateChannel, deleteChannel } = useIglooChat();
  const [copiedId, setCopiedId] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(channel.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentServer?.owner_id === currentUser?.id;

  const menuWidth = 220;
  const menuHeight = 220;
  const left = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const top = Math.min(position.y, window.innerHeight - menuHeight - 10);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRenaming) onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !isRenaming) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isRenaming]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(channel.id);
    setCopiedId(true);
    setTimeout(() => {
      setCopiedId(false);
      onClose();
    }, 900);
  };

  const handleSaveRename = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await updateChannel(channel.id, newName.trim());
    setIsSubmitting(false);

    if (success) {
      setIsRenaming(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o canal "${channel.name}"? As mensagens serão apagadas permanentemente.`)) {
      await deleteChannel(channel.id);
      onClose();
    }
  };

  return (
    <>
      {/* Context Menu Popup */}
      {!isRenaming && (
        <div
          ref={menuRef}
          style={{ top: `${top}px`, left: `${left}px` }}
          className="fixed z-50 w-56 bg-discord-floating border border-discord-darkhover rounded-xl shadow-2xl p-1.5 select-none animate-in fade-in duration-100"
        >
          {/* Channel Name Header */}
          <div className="px-2.5 py-1.5 mb-1 border-b border-discord-darkest flex items-center space-x-2 text-xs font-semibold text-discord-header truncate">
            {channel.type === 'text' ? (
              <Hash className="w-3.5 h-3.5 text-discord-muted flex-shrink-0" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-discord-muted flex-shrink-0" />
            )}
            <span className="truncate">{channel.name}</span>
          </div>

          <div className="space-y-0.5">
            {/* Rename / Edit Channel Button */}
            <button
              onClick={() => setIsRenaming(true)}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-discord-normal hover:bg-discord-blurple hover:text-white rounded-lg transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>Mudar Nome</span>
            </button>

            {/* Copy Channel ID */}
            <button
              onClick={handleCopyId}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-discord-normal hover:bg-discord-darkhover hover:text-white rounded-lg transition"
            >
              <div className="flex items-center space-x-2.5">
                <Copy className="w-4 h-4" />
                <span>Copiar ID</span>
              </div>
              {copiedId && <Check className="w-3.5 h-3.5 text-discord-green" />}
            </button>

            {/* Delete Channel (if Server Owner or Admin) */}
            {isOwner && (
              <>
                <div className="my-1 border-t border-discord-darkest" />
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-discord-red hover:bg-discord-red hover:text-white rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Canal</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rename Modal Modal Dialog */}
      {isRenaming && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
          <div 
            ref={menuRef}
            className="bg-discord-dark border border-discord-floating rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-discord-floating flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {channel.type === 'text' ? (
                  <Hash className="w-5 h-5 text-discord-blurple" />
                ) : (
                  <Volume2 className="w-5 h-5 text-discord-green" />
                )}
                <h3 className="text-white font-bold text-base">Renomear Canal</h3>
              </div>
              <button
                onClick={() => { setIsRenaming(false); onClose(); }}
                className="p-1 rounded-lg hover:bg-white/10 text-discord-muted hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-2">
                  Nome do Canal
                </label>
                <div className="relative">
                  {channel.type === 'text' && (
                    <span className="absolute left-3 top-2.5 text-discord-muted font-bold">#</span>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`w-full bg-discord-darkest text-sm text-white py-2 pr-3 rounded-lg border border-discord-floating focus:border-discord-blurple outline-none transition ${
                      channel.type === 'text' ? 'pl-8' : 'px-3'
                    }`}
                    placeholder="Digite o novo nome do canal"
                    required
                  />
                </div>
                {channel.type === 'text' && (
                  <p className="text-[11px] text-discord-muted mt-1.5">
                    Canais de texto são convertidos automaticamente para letras minúsculas com hífens.
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsRenaming(false); onClose(); }}
                  className="px-4 py-2 text-xs font-medium text-discord-normal hover:underline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || isSubmitting}
                  className="px-5 py-2 bg-discord-blurple hover:bg-discord-blurple-hover disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition shadow"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
