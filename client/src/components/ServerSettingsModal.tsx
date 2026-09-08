import React, { useState, useRef, useEffect } from 'react';
import { useConcord } from '../context/ConcordContext';
import { Server } from '../types';
import { X, Upload, Copy, Check, Trash2, LogOut, ShieldAlert } from 'lucide-react';

interface ServerSettingsModalProps {
  server: Server;
  onClose: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ server, onClose }) => {
  const { currentUser, updateServer, deleteServer, leaveServer } = useConcord();

  const [name, setName] = useState(server.name);
  const [icon, setIcon] = useState(server.icon || '');
  const [iconUrlInput, setIconUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOwner = currentUser?.id === server.owner_id;

  useEffect(() => {
    setName(server.name);
    setIcon(server.icon || '');
  }, [server]);

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
      if (data.url) {
        setIcon(data.url);
      }
    } catch (err) {
      console.error('Upload server icon error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (iconUrlInput.trim()) {
      setIcon(iconUrlInput.trim());
      setIconUrlInput('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    await updateServer(server.id, { name: name.trim(), icon: icon || undefined });
    setIsSaving(false);
    onClose();
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(server.invite_code);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleDelete = async () => {
    if (confirmName !== server.name) return;
    await deleteServer(server.id);
    onClose();
  };

  const handleLeave = async () => {
    if (window.confirm(`Tem certeza que deseja sair do servidor "${server.name}"?`)) {
      await leaveServer(server.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-[#313338] border border-[#232428] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232428]">
          <h2 className="text-base font-bold text-white">Configurações do Servidor — {server.name}</h2>
          <button
            onClick={onClose}
            className="text-discord-muted hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Server Icon with Upload or URL */}
          <div>
            <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-2">
              Ícone do Servidor
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-[#1e1f22] border-2 border-discord-blurple flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                {icon ? (
                  <img src={icon} alt="Server Icon" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {name ? name.substring(0, 2).toUpperCase() : 'CO'}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs px-3 py-1.5 rounded flex items-center space-x-2 transition font-medium"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Enviando...' : 'Fazer Upload de Ícone'}</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <input
                    type="url"
                    placeholder="Ou cole a URL de uma imagem..."
                    value={iconUrlInput}
                    onChange={(e) => setIconUrlInput(e.target.value)}
                    className="flex-1 bg-[#1e1f22] text-xs text-white px-2.5 py-1 rounded border border-[#2b2d31] focus:border-discord-blurple focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="bg-[#2b2d31] hover:bg-[#35373c] text-discord-header text-xs px-2.5 py-1 rounded transition"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Server Name */}
          <div>
            <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
              Nome do Servidor
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2 rounded-lg border border-[#2b2d31] focus:border-discord-blurple focus:outline-none"
            />
          </div>

          {/* Invite Code */}
          <div>
            <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
              Código de Convite do Servidor
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-[#1e1f22] text-xs font-mono text-discord-header px-3 py-2 rounded border border-[#2b2d31]">
                {server.invite_code}
              </div>
              <button
                type="button"
                onClick={copyInvite}
                className="bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs px-3 py-2 rounded flex items-center space-x-1.5 transition"
              >
                {copiedInvite ? <Check className="w-3.5 h-3.5 text-discord-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedInvite ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#232428]">
            {isOwner ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-1.5 text-discord-red hover:underline text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Servidor</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLeave}
                className="flex items-center space-x-1.5 text-discord-red hover:underline text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair do Servidor</span>
              </button>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-discord-header hover:underline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-semibold px-4 py-2 rounded-md transition"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
            <div className="bg-[#313338] border border-discord-red/40 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center space-x-2 text-discord-red font-bold text-base">
                <ShieldAlert className="w-5 h-5" />
                <span>Excluir '{server.name}'</span>
              </div>
              <p className="text-xs text-discord-muted leading-relaxed">
                Tem certeza que deseja excluir o servidor <strong className="text-white">{server.name}</strong>? Esta ação é irreversível e todos os canais e mensagens serão excluídos permanentemente.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-discord-muted uppercase mb-1">
                  Digite o nome do servidor para confirmar:
                </label>
                <input
                  type="text"
                  placeholder={server.name}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="w-full bg-[#1e1f22] text-xs text-white px-3 py-2 rounded border border-[#2b2d31] focus:border-discord-red focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmName('');
                  }}
                  className="px-3 py-1.5 text-xs text-discord-header hover:underline"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={confirmName !== server.name}
                  className={`px-4 py-1.5 rounded text-xs font-semibold text-white transition ${
                    confirmName === server.name
                      ? 'bg-discord-red hover:bg-red-600'
                      : 'bg-discord-red/40 cursor-not-allowed'
                  }`}
                >
                  Excluir Servidor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
