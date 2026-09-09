import React from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { PhoneOff, Monitor, Radio, Info } from 'lucide-react';

export const VoiceConnectionCard: React.FC = () => {
  const {
    currentVoiceChannel,
    currentServer,
    leaveVoiceChannel,
    toggleScreenShare,
    isScreenSharing,
    setActiveStageView,
    activeStageView
  } = useIglooChat();

  if (!currentVoiceChannel) return null;

  return (
    <div className="bg-discord-floating border-t border-discord-darkest px-3 py-2 select-none flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left: Status & Channel Link */}
        <div 
          onClick={() => setActiveStageView('voice')}
          className="flex-1 min-w-0 cursor-pointer group"
        >
          <div className="flex items-center space-x-1.5 text-discord-green text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="truncate group-hover:underline">Voz Conectada</span>
          </div>
          <div className="text-[11px] text-discord-muted truncate flex items-center space-x-1">
            <span className="text-discord-normal font-medium truncate">{currentVoiceChannel.name}</span>
            {currentServer && <span>/ {currentServer.name}</span>}
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Quick Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Parar Transmissão de Tela" : "Compartilhar Tela"}
            className={`p-1.5 rounded hover:bg-discord-darkhover transition ${
              isScreenSharing 
                ? 'text-discord-green bg-[#23a55a]/10 hover:bg-[#23a55a]/20' 
                : 'text-discord-muted hover:text-discord-header'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* Disconnect Call Button */}
          <button
            onClick={leaveVoiceChannel}
            title="Desconectar do Canal de Voz"
            className="p-1.5 rounded hover:bg-discord-darkhover text-discord-muted hover:text-discord-red transition"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
