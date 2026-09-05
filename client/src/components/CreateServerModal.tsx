import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { X, Upload, Gamepad2, School, Users, Sparkles } from 'lucide-react';

export const CreateServerModal: React.FC = () => {
  const { isCreateServerOpen, closeCreateServerModal, createServer } = useConcord();
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isCreateServerOpen) return null;

  const handleTemplateSelect = (defaultName: string) => {
    setName(defaultName);
    setStep('details');
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
    } catch (err) {
      console.error('Create server error', err);
    } finally {
      setLoading(false);
    }
  };

  const PRESET_ICONS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150'
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
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
            {/* Icon Picker */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-bold text-discord-muted uppercase mb-2">Ícone do Servidor</div>
              <div className="flex space-x-2">
                {PRESET_ICONS.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt="Preset"
                    onClick={() => setIcon(preset)}
                    className={`w-12 h-12 rounded-full object-cover cursor-pointer border-2 transition ${
                      icon === preset ? 'border-discord-blurple scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
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
