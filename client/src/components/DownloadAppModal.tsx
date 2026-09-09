import React, { useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { 
  X, 
  Download, 
  Monitor, 
  Smartphone, 
  Check, 
  Copy, 
  ExternalLink,
  Laptop,
  Terminal,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const DownloadAppModal: React.FC = () => {
  const { isDownloadModalOpen, closeDownloadModal } = useIglooChat();
  const [selectedOS, setSelectedOS] = useState<'windows' | 'linux' | 'mac' | 'mobile'>('windows');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isDownloadModalOpen) return null;

  const currentHostUrl = window.location.origin;

  const copyAppWebLink = () => {
    navigator.clipboard.writeText(currentHostUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-discord-dark border border-discord-floating rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-discord-floating flex items-center justify-between bg-discord-darker">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-discord-blurple flex items-center justify-center text-white shadow-lg">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Baixar o IglooChat</h3>
              <p className="text-discord-muted text-xs">Instale no seu computador ou celular e use junto com a versão Web</p>
            </div>
          </div>
          <button
            onClick={closeDownloadModal}
            className="p-2 rounded-lg hover:bg-white/10 text-discord-muted hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OS Selector Tabs */}
        <div className="flex border-b border-discord-floating bg-discord-darkest px-4 pt-2">
          <button
            onClick={() => setSelectedOS('windows')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              selectedOS === 'windows'
                ? 'text-white border-discord-blurple bg-discord-dark'
                : 'text-discord-muted border-transparent hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Windows</span>
          </button>

          <button
            onClick={() => setSelectedOS('linux')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              selectedOS === 'linux'
                ? 'text-white border-discord-blurple bg-discord-dark'
                : 'text-discord-muted border-transparent hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Linux</span>
          </button>

          <button
            onClick={() => setSelectedOS('mac')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              selectedOS === 'mac'
                ? 'text-white border-discord-blurple bg-discord-dark'
                : 'text-discord-muted border-transparent hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>macOS</span>
          </button>

          <button
            onClick={() => setSelectedOS('mobile')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              selectedOS === 'mobile'
                ? 'text-white border-discord-blurple bg-discord-dark'
                : 'text-discord-muted border-transparent hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Celular (PWA)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {selectedOS === 'windows' && (
            <div className="space-y-4">
              <div className="p-4 bg-discord-darker rounded-xl border border-discord-floating flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">IglooChat para Windows (x64)</div>
                  <div className="text-xs text-discord-muted mt-0.5">
                    Instalador autônomo com suporte a captura de áudio nativo de jogos, Spotify e tela cheia.
                  </div>
                </div>
                <button
                  onClick={() => window.open('/api/download/windows', '_blank')}
                  className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 flex-shrink-0 ml-3"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar .exe</span>
                </button>
              </div>

              <div className="text-xs text-discord-muted space-y-2 bg-discord-darkest p-3.5 rounded-xl border border-discord-floating">
                <div className="flex items-center space-x-2 text-discord-green font-semibold">
                  <Zap className="w-4 h-4" />
                  <span>Como rodar via Terminal / Dev:</span>
                </div>
                <code className="block bg-black/40 p-2 rounded text-[11px] font-mono text-gray-200">
                  npm run desktop
                </code>
              </div>
            </div>
          )}

          {selectedOS === 'linux' && (
            <div className="space-y-4">
              <div className="p-4 bg-discord-darker rounded-xl border border-discord-floating flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">IglooChat para Linux (.AppImage / .deb)</div>
                  <div className="text-xs text-discord-muted mt-0.5">
                    Pacote executável direto para Ubuntu, Debian, Fedora, Pop!_OS e Arch Linux.
                  </div>
                </div>
                <button
                  onClick={() => window.open('/api/download/linux', '_blank')}
                  className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 flex-shrink-0 ml-3"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar .AppImage</span>
                </button>
              </div>

              <div className="text-xs text-discord-muted space-y-2 bg-discord-darkest p-3.5 rounded-xl border border-discord-floating">
                <div className="flex items-center space-x-2 text-discord-green font-semibold">
                  <Terminal className="w-4 h-4" />
                  <span>Executar no Linux:</span>
                </div>
                <code className="block bg-black/40 p-2 rounded text-[11px] font-mono text-gray-200">
                  chmod +x IglooChat-1.0.0.AppImage && ./IglooChat-1.0.0.AppImage
                </code>
              </div>
            </div>
          )}

          {selectedOS === 'mac' && (
            <div className="space-y-4">
              <div className="p-4 bg-discord-darker rounded-xl border border-discord-floating flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">IglooChat para macOS (Universal / DMG)</div>
                  <div className="text-xs text-discord-muted mt-0.5">
                    Compatível com Apple Silicon (M1/M2/M3/M4) e processadores Intel.
                  </div>
                </div>
                <button
                  onClick={() => window.open('/api/download/mac', '_blank')}
                  className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5 flex-shrink-0 ml-3"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar .dmg</span>
                </button>
              </div>
            </div>
          )}

          {selectedOS === 'mobile' && (
            <div className="space-y-4">
              <div className="p-4 bg-discord-darker rounded-xl border border-discord-floating space-y-3">
                <div className="text-white font-bold text-sm flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-discord-green" />
                  <span>Instalar no Celular (Android ou iPhone)</span>
                </div>
                <p className="text-xs text-discord-muted leading-relaxed">
                  O IglooChat é um Web App Progressivo (PWA) de ultra-baixa latência. Você pode adicioná-lo à tela inicial do seu celular e usá-lo como um aplicativo nativo completo sem ocupar espaço!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-discord-darkest p-3 rounded-lg border border-discord-floating text-xs">
                    <strong className="text-white block mb-1">No Android (Google Chrome):</strong>
                    <ol className="list-decimal list-inside space-y-1 text-discord-muted">
                      <li>Abra o link do IglooChat</li>
                      <li>Toque nos 3 pontinhos (⋮)</li>
                      <li>Toque em <strong>"Instalar aplicativo"</strong> ou "Adicionar à tela inicial"</li>
                    </ol>
                  </div>

                  <div className="bg-discord-darkest p-3 rounded-lg border border-discord-floating text-xs">
                    <strong className="text-white block mb-1">No iPhone (Safari):</strong>
                    <ol className="list-decimal list-inside space-y-1 text-discord-muted">
                      <li>Abra o link no Safari</li>
                      <li>Toque no botão Compartilhar (⎋)</li>
                      <li>Toque em <strong>"Adicionar à Tela de Início"</strong></li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Share Link Box */}
          <div className="p-4 bg-discord-darkest rounded-xl border border-discord-floating space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Link Público para Enviar aos Amigos:</span>
              {copiedLink && <span className="text-discord-green text-[11px]">Link copiado!</span>}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={currentHostUrl}
                className="flex-1 bg-discord-darkest text-xs text-discord-header px-3 py-2 rounded-lg border border-discord-floating select-all outline-none font-mono"
              />
              <button
                onClick={copyAppWebLink}
                className="px-3 py-2 bg-discord-darker hover:bg-discord-darkhover border border-discord-floating text-white text-xs font-semibold rounded-lg transition flex items-center space-x-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-discord-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-discord-darker border-t border-discord-floating flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-discord-muted">
            <ShieldCheck className="w-4 h-4 text-discord-green" />
            <span>Funciona simultaneamente na Web, no Celular e no App Desktop</span>
          </div>
          <button
            onClick={closeDownloadModal}
            className="px-4 py-1.5 bg-discord-darkest hover:bg-discord-darkhover border border-discord-floating text-white text-xs font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
