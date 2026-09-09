import React from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { Phone, PhoneOff, Video, Tv } from 'lucide-react';

export const IncomingCallModal: React.FC = () => {
  const { directCall, acceptDirectCall, rejectDirectCall } = useIglooChat();

  if (!directCall || directCall.status !== 'incoming') return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-6 duration-300">
      <div className="bg-discord-floating border-2 border-discord-blurple rounded-2xl p-4 shadow-2xl w-80 flex flex-col items-center select-none">
        {/* Caller Avatar with pulsing ring */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-discord-blurple">
            <img
              src={directCall.caller.avatar}
              alt={directCall.caller.username}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute -inset-1 rounded-full border-2 border-discord-blurple animate-ping opacity-75" />
        </div>

        <div className="font-bold text-base text-white text-center">
          {directCall.caller.username}
        </div>
        <div className="text-xs text-discord-muted text-center mb-4">
          Chamada Privada de Voz, Vídeo e Tela...
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 w-full justify-center">
          {/* Reject */}
          <button
            onClick={rejectDirectCall}
            title="Recusar Chamada"
            className="w-12 h-12 rounded-full bg-discord-red hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          {/* Accept */}
          <button
            onClick={acceptDirectCall}
            title="Atender Chamada"
            className="w-12 h-12 rounded-full bg-discord-green hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition animate-bounce"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
