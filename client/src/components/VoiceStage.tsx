import React, { useRef, useEffect, useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { 
  Mic, 
  MicOff, 
  Headphones, 
  VolumeX, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  PhoneOff, 
  Maximize2, 
  Minimize2, 
  LayoutGrid, 
  Tv, 
  Radio, 
  MessageSquare 
} from 'lucide-react';

interface StreamVideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

const StreamVideo: React.FC<StreamVideoProps> = ({ stream, muted = false, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`w-full h-full object-contain ${className}`}
    />
  );
};

export const VoiceStage: React.FC = () => {
  const {
    currentVoiceChannel,
    currentUser,
    voiceParticipants,
    isMuted,
    isDeafened,
    isVideoOn,
    isScreenSharing,
    isSpeaking,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    toggleScreenShare,
    leaveVoiceChannel,
    localScreenStream,
    localVideoStream,
    remoteStreams,
    setActiveStageView
  } = useConcord();

  const [layoutMode, setLayoutMode] = useState<'focus' | 'grid'>('focus');
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  // Identify who is sharing screen
  const isLocalScreenActive = isScreenSharing && !!localScreenStream;

  // Find any remote screen share
  const remoteScreenShare = Object.entries(remoteStreams).find(
    ([, streams]) => !!streams.screenStream
  );

  const hasActiveScreenShare = isLocalScreenActive || !!remoteScreenShare;

  // Fullscreen trigger for the entire stage or screen share
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      stageContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Compile all participants including current local user
  const allParticipants = [
    {
      socketId: 'local',
      user: currentUser,
      isMuted,
      isDeafened,
      isVideoOn,
      isScreenSharing,
      isSpeaking,
      isLocal: true,
      cameraStream: localVideoStream,
      screenStream: localScreenStream
    },
    ...voiceParticipants
      .filter(p => p.user.id !== currentUser.id)
      .map(p => ({
        ...p,
        isLocal: false,
        cameraStream: remoteStreams[p.socketId]?.cameraStream || null,
        screenStream: remoteStreams[p.socketId]?.screenStream || null
      }))
  ];

  // Active featured screen stream
  let featuredScreenStream: MediaStream | null = null;
  let featuredScreenOwner: string = '';

  if (isLocalScreenActive) {
    featuredScreenStream = localScreenStream;
    featuredScreenOwner = `${currentUser.username} (Você)`;
  } else if (remoteScreenShare) {
    featuredScreenStream = remoteScreenShare[1].screenStream!;
    const ownerParticipant = voiceParticipants.find(p => p.socketId === remoteScreenShare[0]);
    featuredScreenOwner = ownerParticipant?.user.username || 'Participante';
  }

  return (
    <div 
      ref={stageContainerRef}
      className="flex-1 h-full bg-[#111214] flex flex-col relative select-none overflow-hidden"
    >
      {/* Top Header of Call Stage */}
      <div className="h-12 px-4 bg-[#111214]/90 backdrop-blur border-b border-[#1f2023] flex items-center justify-between z-20">
        <div className="flex items-center space-x-3 truncate">
          <div className="flex items-center space-x-2 text-discord-header font-semibold text-sm truncate">
            <Radio className="w-4 h-4 text-discord-green animate-pulse" />
            <span className="truncate">{currentVoiceChannel?.name || 'Canal de Voz & Tela'}</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#23a55a]/10 border border-[#23a55a]/30 text-discord-green text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-discord-green animate-ping" />
            <span>RTC Conectado • 1080p 60fps</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Layout Mode Toggle */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'focus' ? 'grid' : 'focus')}
            title={layoutMode === 'focus' ? 'Modo Grade' : 'Modo Destaque'}
            className="p-1.5 rounded hover:bg-[#35373c] text-discord-muted hover:text-white transition text-xs flex items-center space-x-1"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline font-medium">
              {layoutMode === 'focus' ? 'Grade' : 'Foco'}
            </span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Alternar Tela Cheia"
            className="p-1.5 rounded hover:bg-[#35373c] text-discord-muted hover:text-white transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Switch back to Chat View without leaving call */}
          <button
            onClick={() => setActiveStageView('chat')}
            title="Minimizar Palco de Voz (Voltar ao Chat)"
            className="p-1.5 rounded hover:bg-[#35373c] text-discord-muted hover:text-white transition flex items-center space-x-1"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Chat de Texto</span>
          </button>
        </div>
      </div>

      {/* Main View Area: Screen Share + Participants */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col justify-center items-center relative">
        {/* CASE 1: FOCUS / THEATER MODE WITH SCREEN SHARE */}
        {layoutMode === 'focus' && hasActiveScreenShare && featuredScreenStream ? (
          <div className="w-full h-full flex flex-col gap-3">
            {/* The Big Screen Share Theatre */}
            <div className="flex-1 relative bg-black rounded-xl overflow-hidden shadow-2xl border border-[#232428] flex items-center justify-center group">
              <StreamVideo stream={featuredScreenStream} muted={isLocalScreenActive} />

              {/* Red "AO VIVO / LIVE" Badge Overlay */}
              <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-md border border-white/10 shadow-lg">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-discord-red text-white tracking-wider flex items-center space-x-1 animate-pulse">
                  <Tv className="w-3 h-3" />
                  <span>AO VIVO</span>
                </span>
                <span className="text-white text-xs font-medium">{featuredScreenOwner}</span>
              </div>

              {/* Resolution Info Pill */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition bg-black/70 text-[11px] font-mono text-discord-normal px-2 py-1 rounded">
                1920x1080 @ 60 FPS
              </div>
            </div>

            {/* Row of Participant Tiles at Bottom */}
            <div className="h-28 flex items-center justify-center space-x-3 overflow-x-auto py-1 scrollbar-none">
              {allParticipants.map((p) => {
                const isSpeakingUser = p.isSpeaking;

                return (
                  <div
                    key={p.socketId}
                    className={`relative h-full aspect-video bg-[#232428] rounded-lg overflow-hidden border transition-all flex flex-col items-center justify-center shadow-md ${
                      isSpeakingUser
                        ? 'border-discord-green ring-2 ring-discord-green'
                        : 'border-[#2f3136]'
                    }`}
                  >
                    {/* Camera Video or Avatar */}
                    {p.isVideoOn && p.cameraStream ? (
                      <StreamVideo stream={p.cameraStream} muted={p.isLocal} className="object-cover" />
                    ) : (
                      <div className="relative">
                        <img
                          src={p.user.avatar}
                          alt={p.user.username}
                          className={`w-10 h-10 rounded-full object-cover transition-transform ${
                            isSpeakingUser ? 'scale-110' : ''
                          }`}
                        />
                      </div>
                    )}

                    {/* Name tag */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] text-white">
                      <span className="truncate">{p.user.username}</span>
                      <div className="flex items-center space-x-1">
                        {p.isMuted && <MicOff className="w-2.5 h-2.5 text-discord-red" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* CASE 2: GRID MODE (Equal Participant Cards) */
          <div className="w-full h-full max-w-6xl max-h-[80vh] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr">
            {allParticipants.map((p) => {
              const isSpeakingUser = p.isSpeaking;
              const hasScreen = p.isScreenSharing && p.screenStream;

              return (
                <div
                  key={p.socketId}
                  className={`relative w-full h-full min-h-[160px] bg-[#1e1f22] rounded-xl overflow-hidden border transition-all flex flex-col items-center justify-center shadow-xl group ${
                    isSpeakingUser
                      ? 'border-discord-green ring-2 ring-discord-green'
                      : 'border-[#2b2d31]'
                  }`}
                >
                  {/* If this participant is screen sharing, show screen stream! */}
                  {hasScreen ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-black">
                      <StreamVideo stream={p.screenStream} muted={p.isLocal} />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-discord-red text-white flex items-center space-x-1">
                        <Tv className="w-3 h-3" />
                        <span>TELA AO VIVO</span>
                      </div>
                    </div>
                  ) : p.isVideoOn && p.cameraStream ? (
                    <StreamVideo stream={p.cameraStream} muted={p.isLocal} className="object-cover" />
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative">
                        <img
                          src={p.user.avatar}
                          alt={p.user.username}
                          className={`w-20 h-20 rounded-full object-cover transition-all duration-150 ${
                            isSpeakingUser
                              ? 'ring-4 ring-discord-green scale-105 shadow-[0_0_25px_#23a55a]'
                              : 'ring-2 ring-transparent'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Name Tag & Badges Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded-md bg-black/60 backdrop-blur text-xs text-white">
                    <span className="truncate font-semibold">{p.user.username} {p.isLocal ? '(Você)' : ''}</span>
                    <div className="flex items-center space-x-1.5">
                      {p.isMuted && <MicOff className="w-3.5 h-3.5 text-discord-red" />}
                      {p.isDeafened && <VolumeX className="w-3.5 h-3.5 text-discord-red" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Control Dock (Discord signature pill bar) */}
      <div className="h-20 flex items-center justify-center z-30 pb-2">
        <div className="bg-[#1e1f22]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-[#2f3136] flex items-center space-x-3">
          {/* Camera Button */}
          <button
            onClick={toggleVideo}
            title={isVideoOn ? "Desligar Câmera" : "Ligar Câmera"}
            className={`p-3 rounded-full transition flex items-center justify-center ${
              isVideoOn 
                ? 'bg-white text-[#1e1f22] hover:bg-gray-200' 
                : 'bg-[#2b2d31] text-discord-header hover:bg-[#35373c]'
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* SCREEN SHARING BUTTON (O DESTAQUE PRINCIPAL!) */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Parar Compartilhamento de Tela" : "Compartilhar sua Tela"}
            className={`px-4 py-3 rounded-full font-semibold text-xs transition flex items-center space-x-2 shadow-lg ${
              isScreenSharing
                ? 'bg-discord-green text-white hover:bg-emerald-600 ring-2 ring-emerald-400/50'
                : 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
            }`}
          >
            {isScreenSharing ? (
              <>
                <MonitorOff className="w-5 h-5 animate-pulse" />
                <span>Parar Tela</span>
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5" />
                <span>Compartilhar Tela</span>
              </>
            )}
          </button>

          {/* Microphone Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? "Desmutar Microfone" : "Mutar Microfone"}
            className={`p-3 rounded-full transition flex items-center justify-center ${
              isMuted 
                ? 'bg-discord-red text-white hover:bg-red-600' 
                : 'bg-[#2b2d31] text-discord-header hover:bg-[#35373c]'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deafen Toggle */}
          <button
            onClick={toggleDeafen}
            title={isDeafened ? "Ativar Som" : "Ensurdecer"}
            className={`p-3 rounded-full transition flex items-center justify-center ${
              isDeafened 
                ? 'bg-discord-red text-white hover:bg-red-600' 
                : 'bg-[#2b2d31] text-discord-header hover:bg-[#35373c]'
            }`}
          >
            {isDeafened ? <VolumeX className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </button>

          <div className="w-[1px] h-6 bg-[#35373c]" />

          {/* Disconnect Red Button */}
          <button
            onClick={leaveVoiceChannel}
            title="Desconectar da Chamada"
            className="p-3 rounded-full bg-discord-red hover:bg-red-600 text-white transition flex items-center justify-center shadow-lg"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
