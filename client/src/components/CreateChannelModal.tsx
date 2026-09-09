import React, { useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { X, Hash, Volume2 } from 'lucide-react';

export const CreateChannelModal: React.FC = () => {
  const {
    isCreateChannelOpen,
    closeCreateChannelModal,
    createChannel,
    selectedCategoryId,
    currentServer
  } = useIglooChat();

  const [type, setType] = useState<'text' | 'voice'>('text');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isCreateChannelOpen || !currentServer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);

    try {
      await createChannel(name, type, selectedCategoryId || undefined, topic);
      setName('');
      setTopic('');
    } catch (e) {
      console.error('Create channel error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-discord-dark border border-discord-floating rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-6 pb-2 relative">
          <button
            onClick={closeCreateChannelModal}
            className="absolute top-4 right-4 text-discord-muted hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white">Criar Canal</h2>
          <div className="text-xs text-discord-muted">em {currentServer.name}</div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="block text-xs font-bold text-discord-muted uppercase mb-2">
              Tipo de Canal
            </label>
            <div className="space-y-2">
              {/* Text Channel Option */}
              <div
                onClick={() => setType('text')}
                className={`p-3 rounded-lg border flex items-center space-x-3 cursor-pointer transition ${
                  type === 'text'
                    ? 'bg-discord-darkhover border-discord-blurple text-white'
                    : 'bg-discord-darker border-discord-floating/30 text-discord-muted hover:bg-discord-darkhover/50'
                }`}
              >
                <Hash className="w-6 h-6 text-discord-muted" />
                <div>
                  <div className="font-semibold text-sm text-white">Texto</div>
                  <div className="text-xs text-discord-muted">Poste mensagens, imagens e códigos</div>
                </div>
              </div>

              {/* Voice Channel Option */}
              <div
                onClick={() => setType('voice')}
                className={`p-3 rounded-lg border flex items-center space-x-3 cursor-pointer transition ${
                  type === 'voice'
                    ? 'bg-discord-darkhover border-discord-green text-white'
                    : 'bg-discord-darker border-discord-floating/30 text-discord-muted hover:bg-discord-darkhover/50'
                }`}
              >
                <Volume2 className="w-6 h-6 text-discord-green" />
                <div>
                  <div className="font-semibold text-sm text-white">Voz & Transmissão</div>
                  <div className="text-xs text-discord-muted">Converse por voz, vídeo e compartilhe tela</div>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold text-discord-muted uppercase mb-1.5">
              Nome do Canal
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-discord-muted">
                {type === 'text' ? <Hash className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'text' ? 'novo-canal' : 'Sala de Voz e Tela'}
                className="w-full bg-discord-darkest text-sm text-white pl-9 pr-3.5 py-2.5 rounded-lg border border-discord-floating focus:border-discord-blurple focus:outline-none"
              />
            </div>
          </div>

          {/* Channel Topic */}
          {type === 'text' && (
            <div>
              <label className="block text-xs font-bold text-discord-muted uppercase mb-1.5">
                Tópico do Canal (Opcional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Discussões técnicas sobre o projeto"
                className="w-full bg-discord-darkest text-sm text-white px-3.5 py-2.5 rounded-lg border border-discord-floating focus:border-discord-blurple focus:outline-none"
              />
            </div>
          )}

          <div className="bg-discord-darker border-t border-discord-floating -mx-6 -mb-6 p-4 flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={closeCreateChannelModal}
              className="text-xs font-semibold text-discord-normal hover:underline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
