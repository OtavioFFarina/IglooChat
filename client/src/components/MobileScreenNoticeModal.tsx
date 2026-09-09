import React from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { 
  X, 
  Smartphone, 
  Video, 
  Download, 
  CheckCircle2, 
  Monitor, 
  Info
} from 'lucide-react';

export const MobileScreenNoticeModal: React.FC = () => {
  const { 
    isMobileScreenNoticeOpen, 
    setIsMobileScreenNoticeOpen,
    toggleVideo,
    isVideoOn,
    openDownloadModal
  } = useIglooChat();

  if (!isMobileScreenNoticeOpen) return null;

  const handleTurnOnCamera = () => {
    setIsMobileScreenNoticeOpen(false);
    if (!isVideoOn) {
      toggleVideo();
    }
  };

  const handleOpenDownload = () => {
    setIsMobileScreenNoticeOpen(false);
    openDownloadModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-discord-dark border border-discord-floating rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-discord-floating flex items-center justify-between bg-discord-darker">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-discord-amber/20 border border-discord-amber/30 flex items-center justify-center text-discord-amber shadow-md flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg leading-tight">
                Transmissão no Celular
              </h3>
              <p className="text-discord-muted text-xs">
                Aviso sobre navegadores móveis
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileScreenNoticeOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 text-discord-muted hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm text-discord-normal">
          <div className="bg-discord-darkest p-3.5 rounded-xl border border-discord-floating/60 flex items-start space-x-3">
            <Info className="w-5 h-5 text-discord-blurple flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-white font-medium">
                Por que a tela não transmite aqui?
              </p>
              <p className="text-discord-muted text-xs leading-relaxed">
                Por regras de segurança dos sistemas <strong>Android</strong> e <strong>iOS</strong>, navegadores web (como Chrome e Safari no celular) bloqueiam a gravação e transmissão direta de tela via web.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-discord-muted uppercase tracking-wider">
              O que você pode fazer no IglooChat:
            </div>

            <div className="flex items-start space-x-2.5 bg-discord-darker/60 p-2.5 rounded-lg border border-discord-floating/30">
              <CheckCircle2 className="w-4 h-4 text-discord-green flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-white">Assistir transmissões: </span>
                <span className="text-discord-muted">Você pode assistir perfeitamente e em tempo real a tela transmitida por amigos no computador!</span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-discord-darker/60 p-2.5 rounded-lg border border-discord-floating/30">
              <CheckCircle2 className="w-4 h-4 text-discord-green flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-white">Ligar Câmera: </span>
                <span className="text-discord-muted">Transmitir sua câmera de vídeo (frontal ou traseira) funciona perfeitamente no celular.</span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-discord-darker/60 p-2.5 rounded-lg border border-discord-floating/30">
              <Monitor className="w-4 h-4 text-discord-blurple flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-white">Computador: </span>
                <span className="text-discord-muted">No PC (Navegador ou App Desktop), a transmissão de jogos, abas e telas completas funciona com áudio integrado.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-discord-darker border-t border-discord-floating flex flex-col sm:flex-row items-center gap-2 sm:justify-end">
          {!isVideoOn && (
            <button
              onClick={handleTurnOnCamera}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-discord-green hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-md active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Ligar Minha Câmera</span>
            </button>
          )}

          <button
            onClick={handleOpenDownload}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-lg bg-discord-darkhover hover:bg-discord-floating text-discord-header font-semibold text-xs flex items-center justify-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4 text-discord-blurple" />
            <span>Versão PC</span>
          </button>

          <button
            onClick={() => setIsMobileScreenNoticeOpen(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-discord-blurple hover:bg-discord-blurple-hover text-white font-semibold text-xs transition"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
