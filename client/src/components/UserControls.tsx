import React from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { Mic, MicOff, Headphones, VolumeX, Settings, AudioWaveform } from 'lucide-react';

export const UserControls: React.FC = () => {
  const {
    currentUser,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    openUserSettingsModal,
    isNoiseSuppressionEnabled,
    toggleNoiseSuppression
  } = useIglooChat();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-discord-green';
      case 'idle': return 'bg-discord-amber';
      case 'dnd': return 'bg-discord-red';
      default: return 'bg-discord-gray';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="h-[52px] bg-discord-floating px-2 flex items-center justify-between border-t border-discord-darkest select-none flex-shrink-0">
      {/* User Info with Avatar & Status */}
      <div 
        onClick={openUserSettingsModal}
        className="flex items-center space-x-2 py-1 px-1.5 rounded-md hover:bg-discord-darkhover cursor-pointer transition flex-1 min-w-0 mr-1"
      >
        <div className="relative flex-shrink-0">
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-floating ${getStatusColor(
              currentUser.status
            )}`}
          />
        </div>
        <div className="truncate text-xs leading-tight">
          <div className="font-semibold text-discord-header truncate">{currentUser.username}</div>
          <div className="text-[11px] text-discord-muted truncate">#{currentUser.discriminator}</div>
        </div>
      </div>

      {/* Control Buttons: Mic, Deafen, Settings */}
      <div className="flex items-center space-x-0.5 text-discord-muted">
        {/* Microphone Toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          className={`p-1.5 rounded-md hover:bg-discord-darkhover transition ${
            isMuted ? 'text-discord-red hover:text-discord-red' : 'hover:text-discord-header'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Headphones / Deafen Toggle */}
        <button
          onClick={toggleDeafen}
          title={isDeafened ? 'Ativar Som' : 'Ensurdecer'}
          className={`p-1.5 rounded-md hover:bg-discord-darkhover transition ${
            isDeafened ? 'text-discord-red hover:text-discord-red' : 'hover:text-discord-header'
          }`}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </button>

        {/* Noise Suppression Toggle */}
        <button
          onClick={toggleNoiseSuppression}
          title={isNoiseSuppressionEnabled ? 'Supressão de Ruído Ativada (Krisp)' : 'Supressão de Ruído Desativada'}
          className={`p-1.5 rounded-md hover:bg-discord-darkhover transition ${
            isNoiseSuppressionEnabled ? 'text-discord-green' : 'text-discord-muted hover:text-discord-header'
          }`}
        >
          <AudioWaveform className="w-4 h-4" />
        </button>

        {/* User Settings Modal Trigger */}
        <button
          onClick={openUserSettingsModal}
          title="Configurações de Usuário"
          className="p-1.5 rounded-md hover:bg-discord-darkhover hover:text-discord-header transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
