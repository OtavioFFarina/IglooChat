import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { X, Compass } from 'lucide-react';

export const JoinServerModal: React.FC = () => {
  const { isJoinServerOpen, closeJoinServerModal, joinServer } = useConcord();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isJoinServerOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    setError('');

    const success = await joinServer(code);
    setLoading(false);
    if (!success) {
      setError('Código de convite inválido ou expirado. Tente "concord-oficial" ou "dev-pair-2026".');
    } else {
      setCode('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#313338] border border-[#232428] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-6 text-center relative pb-2">
          <button
            onClick={closeJoinServerModal}
            className="absolute top-4 right-4 text-discord-muted hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-discord-green/20 text-discord-green flex items-center justify-center mx-auto mb-2">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Entrar em um Servidor</h2>
          <p className="text-xs text-discord-muted mt-1">
            Digite um código de convite abaixo para se juntar a um servidor existente.
          </p>
        </div>

        <form onSubmit={handleJoin} className="p-6 pt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-discord-muted uppercase mb-1.5">
              Código de Convite *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: concord-oficial ou dev-pair-2026"
              className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-lg border border-[#2b2d31] focus:border-discord-green focus:outline-none"
            />
            {error && <div className="text-xs text-discord-red mt-1.5">{error}</div>}
          </div>

          <div className="text-xs text-discord-muted space-y-1 bg-[#1e1f22] p-3 rounded-lg border border-[#2b2d31]">
            <div className="font-semibold text-discord-normal">Convites públicos de exemplo:</div>
            <div>• <code className="text-white font-mono bg-[#2b2d31] px-1 rounded cursor-pointer" onClick={() => setCode('concord-oficial')}>concord-oficial</code> (Hub Geral)</div>
            <div>• <code className="text-white font-mono bg-[#2b2d31] px-1 rounded cursor-pointer" onClick={() => setCode('dev-pair-2026')}>dev-pair-2026</code> (Pair Programming)</div>
          </div>

          <div className="bg-[#2b2d31] -mx-6 -mb-6 p-4 flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={closeJoinServerModal}
              className="text-xs font-semibold text-discord-normal hover:underline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="bg-discord-green hover:bg-emerald-600 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar no Servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
