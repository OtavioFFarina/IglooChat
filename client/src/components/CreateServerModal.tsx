import React, { useState, useRef } from 'react';
import { useConcord } from '../context/ConcordContext';
import { X, Upload, Gamepad2, School, Users, Sparkles } from 'lucide-react';

export const CreateServerModal: React.FC = () => {
  const { isCreateServerOpen, closeCreateServerModal, createServer } = useConcord();
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [iconUrlInput, setIconUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCreateServerOpen) return null;

  const handleTemplateSelect = (defaultName: string) => {
    setName(defaultName);
    setStep('details');
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
      if (data.url) {
        setIcon(data.url);
      }
    } catch (err) {
      console.error('Erro ao enviar ícone do servidor:', err);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      await createServer(name, icon);
      setStep('template');
      setName('');
      setIcon('');
      setIconUrlInput('');
    } catch (err) {
      console.error('Create server error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-[#313338] border border-[#232428] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 text-center relative pb-2">
          <button
            onClick={closeCreateServerModal}
            className="absolute top-4 right-4 text-discord-muted hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">Criar seu servidor</h2>
          <p className="text-xs text-discord-muted mt-1">
            Seu servidor é onde você e seus amigos se reúnem. Crie o seu e comece a conversar por voz, texto e tela.
          </p>
        </div>

        {step === 'template' ? (
          <div className="p-6 pt-2 space-y-2.5">
            <button
              onClick={() => handleTemplateSelect('Servidor do Usuário')}
              className="w-full flex items-center space-x-4 p-3 rounded-lg border border-[#2b2d31] hover:bg-[#35373c] transition group text-left"
            >
              <div className="p-2.5 bg-discord-blurple/20 text-discord-blurple rounded-lg group-hover:bg-discord-blurple group-hover:text-white transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Criar o meu</div>
                <div className="text-xs text-discord-muted">Personalize do zero</div>
              </div>
            </button>

            <button
              onClick={() => handleTemplateSelect('Comunidade de Jogos')}
              className="w-full flex items-center space-x-4 p-3 rounded-lg border border-[#2b2d31] hover:bg-[#35373c] transition group text-left"
            >
              <div className="p-2.5 bg-discord-green/20 text-discord-green rounded-lg group-hover:bg-discord-green group-hover:text-white transition">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Jogos & Streaming</div>
                <div className="text-xs text-discord-muted">Com canais de transmissão prontos</div>
              </div>
            </button>

            <button
              onClick={() => handleTemplateSelect('Clube Escolar & Estudos')}
              className="w-full flex items-center space-x-4 p-3 rounded-lg border border-[#2b2d31] hover:bg-[#35373c] transition group text-left"
            >
              <div className="p-2.5 bg-discord-amber/20 text-discord-amber rounded-lg group-hover:bg-discord-amber group-hover:text-white transition">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Clube Escolar & Estudos</div>
                <div className="text-xs text-discord-muted">Ideal para pair programming e aulas</div>
              </div>
            </button>

            <button
              onClick={() => handleTemplateSelect('Amigos & Bate-papo')}
              className="w-full flex items-center space-x-4 p-3 rounded-lg border border-[#2b2d31] hover:bg-[#35373c] transition group text-left"
            >
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Amigos & Bate-papo</div>
                <div className="text-xs text-discord-muted">Para relaxar e trocar ideias</div>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="p-6 pt-2 space-y-4">
            {/* Server Icon with Upload or URL */}
            <div>
              <div className="text-xs font-bold text-discord-muted uppercase mb-2">Ícone do Servidor</div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-[#1e1f22] border-2 border-discord-blurple flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                  {icon ? (
                    <img src={icon} alt="Server Icon Preview" className="w-full h-full object-cover" />
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

            <div>
              <label className="block text-xs font-bold text-discord-muted uppercase mb-1.5">
                Nome do Servidor
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Comunidade dos Desenvolvedores"
                className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-lg border border-[#2b2d31] focus:border-discord-blurple focus:outline-none"
              />
            </div>

            <div className="bg-[#2b2d31] -mx-6 -mb-6 p-4 flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={() => setStep('template')}
                className="text-xs font-semibold text-discord-normal hover:underline"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Servidor'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
