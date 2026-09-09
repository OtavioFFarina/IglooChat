import React, { useRef, useEffect, useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { 
  Mic, 
  MicOff, 
  Headphones, 
  VolumeX, 
  Volume2,
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
  MessageSquare,
  AudioWaveform,
  Play,
  Download,
  Menu
} from 'lucide-react';

interface StreamVideoProps {
  stream: MediaStream | null;
  className?: string;
  mirrored?: boolean;
  onAspectRatioChange?: (isPortrait: boolean, ratio: number) => void;
}

const StreamVideo: React.FC<StreamVideoProps> = ({ 
  stream, 
  className = '', 
  mirrored = false,
  onAspectRatioChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const checkDimensions = () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w > 0 && h > 0) {
      const isPortrait = h > w;
      const ratio = w / h;
      onAspectRatioChange?.(isPortrait, ratio);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    const playVideo = () => {
      video.play().catch(e => console.warn('[StreamVideo] Autoplay note:', e));
      checkDimensions();
    };

    playVideo();

    video.onloadedmetadata = checkDimensions;
    video.onresize = checkDimensions;

    stream.getVideoTracks().forEach(track => {
      track.onunmute = playVideo;
      const settings = track.getSettings?.();
      if (settings && settings.width && settings.height) {
        onAspectRatioChange?.(settings.height > settings.width, settings.width / settings.height);
      }
    });

    return () => {
      if (video) {
        video.onloadedmetadata = null;
        video.onresize = null;
      }
    };
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={true}
      className={`w-full h-full pointer-events-none ${mirrored ? 'scale-x-[-1]' : ''} ${className}`}
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
    setActiveStageView,
    userAudioSettings,
    openUserContextMenu,
    isNoiseSuppressionEnabled,
    toggleNoiseSuppression,
    watchingStreams,
    startWatchingStream,
    stopWatchingStream,
    isWatchingStream,
    streamAudioSettings,
    setStreamVolume,
    toggleStreamMute,
    openDownloadModal,
    toggleMobileNav
  } = useIglooChat();

  const [layoutMode, setLayoutMode] = useState<'focus' | 'grid'>('focus');
  const [focusedSocketId, setFocusedSocketId] = useState<string | null>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const screenTheatreRef = useRef<HTMLDivElement>(null);

  // Fullscreen HUD auto-hide state (YouTube style)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (active) {
        setShowControls(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (document.fullscreenElement) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  const toggleTheaterFullscreen = () => {
    if (!document.fullscreenElement) {
      screenTheatreRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleGlobalFullscreen = () => {
    if (!document.fullscreenElement) {
      stageContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!currentUser) return null;

  const isLocalScreenActive = isScreenSharing && !!localScreenStream;

  // Find any active remote screen share (verifying participant.isScreenSharing is true)
  const remoteScreenShareEntry = Object.entries(remoteStreams).find(
    ([socketId, streams]) => {
      const p = voiceParticipants.find(vp => vp.socketId === socketId);
      return !!streams.screenStream && p?.isScreenSharing === true;
    }
  );

  const hasActiveScreenShare = isLocalScreenActive || !!remoteScreenShareEntry;

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

  let featuredScreenStream: MediaStream | null = null;
  let featuredScreenOwner = '';
  let featuredScreenSocketId = '';
  let isFeaturedWatching = false;

  if (isLocalScreenActive) {
    featuredScreenStream = localScreenStream;
    featuredScreenOwner = `${currentUser.username} (Você)`;
    featuredScreenSocketId = 'local';
    isFeaturedWatching = true;
  } else if (remoteScreenShareEntry) {
    featuredScreenSocketId = remoteScreenShareEntry[0];
    featuredScreenStream = remoteScreenShareEntry[1].screenStream!;
    const ownerParticipant = voiceParticipants.find(p => p.socketId === featuredScreenSocketId);
    featuredScreenOwner = ownerParticipant?.user.username || 'Participante';
    isFeaturedWatching = isWatchingStream(featuredScreenSocketId);
  }

  // Active stream audio volume & mute
  const activeStreamSetting = featuredScreenSocketId && featuredScreenSocketId !== 'local'
    ? streamAudioSettings[featuredScreenSocketId]
    : null;
  const activeStreamVolume = activeStreamSetting ? (activeStreamSetting.volume ?? 100) : 100;
  const isActiveStreamMuted = activeStreamSetting ? activeStreamSetting.muted : false;

  const [streamAspects, setStreamAspects] = useState<Record<string, { isPortrait: boolean; ratio: number }>>({});

  const handleStreamAspectChange = (socketId: string, isPortrait: boolean, ratio: number) => {
    setStreamAspects(prev => {
      if (prev[socketId]?.isPortrait === isPortrait && Math.abs((prev[socketId]?.ratio || 0) - ratio) < 0.05) {
        return prev;
      }
      return { ...prev, [socketId]: { isPortrait, ratio } };
    });
  };

  const checkIsPortrait = (p: typeof allParticipants[0]) => {
    if (!p.isVideoOn || !p.cameraStream) return false;
    if (p.isScreenSharing) return false;

    const tracked = streamAspects[p.socketId];
    if (tracked) return tracked.isPortrait;

    const videoTrack = p.cameraStream.getVideoTracks()[0];
    const settings = videoTrack?.getSettings?.();
    if (settings && settings.width && settings.height) {
      return settings.height > settings.width;
    }

    return false;
  };

  // Selected hero participant for focus mode when not sharing screen
  const heroParticipant = allParticipants.find(p => p.socketId === focusedSocketId)
    || allParticipants.find(p => !p.isLocal && p.isSpeaking)
    || allParticipants.find(p => p.isVideoOn)
    || allParticipants[0];

  // Helper for rendering a single participant card
  const renderParticipantTile = (p: typeof allParticipants[0], isSmall = false, isHero = false) => {
    const isSpeakingUser = p.isSpeaking;
    const hasScreen = p.isScreenSharing && p.screenStream;
    const isVideoDisabledLocally = !p.isLocal && userAudioSettings[p.user.id]?.videoDisabled;
    const showCamera = p.isVideoOn && p.cameraStream && !isVideoDisabledLocally;
    const isPeerWatchingScreen = p.isLocal ? true : isWatchingStream(p.socketId);
    const isPortrait = checkIsPortrait(p);

    const cardAspect = isSmall 
      ? 'aspect-video' 
      : hasScreen 
      ? 'aspect-video' 
      : isPortrait 
      ? 'aspect-[9/16] sm:aspect-[3/4]' 
      : 'aspect-video';

    return (
      <div
        key={p.socketId}
        onClick={() => {
          if (layoutMode === 'focus') {
            setFocusedSocketId(p.socketId);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openUserContextMenu(p.user, e.clientX, e.clientY);
        }}
        className={`relative ${cardAspect} bg-discord-darkest rounded-xl overflow-hidden border transition-all duration-200 flex flex-col items-center justify-center shadow-lg group cursor-pointer ${
          isSpeakingUser
            ? 'border-discord-green ring-2 ring-discord-green'
            : focusedSocketId === p.socketId && layoutMode === 'focus' && !isHero
            ? 'border-discord-blurple ring-2 ring-discord-blurple'
            : 'border-discord-floating hover:border-discord-blurple'
        } ${isSmall ? 'h-full flex-shrink-0' : 'w-full h-full'}`}
        title={`${p.user.username} - Clique com botão direito para opções`}
      >
        {/* If this participant is screen sharing */}
        {hasScreen ? (
          isPeerWatchingScreen ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black group/stream">
              <StreamVideo stream={p.screenStream} className="object-contain w-full h-full" />

              {/* Top badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-discord-red text-white flex items-center space-x-1 shadow">
                <Tv className="w-3 h-3" />
                <span>AO VIVO</span>
              </div>

              {/* Stop watching hover overlay */}
              {!p.isLocal && (
                <div className="absolute top-2 right-2 opacity-0 group-hover/stream:opacity-100 transition flex items-center space-x-1 bg-black/70 p-1 rounded-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stopWatchingStream(p.socketId);
                    }}
                    className="px-2 py-0.5 bg-discord-red hover:bg-red-600 text-white rounded text-[10px] font-semibold flex items-center space-x-1"
                    title="Parar de Assistir"
                  >
                    <MonitorOff className="w-3 h-3" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Watch Stream Opt-in Tile */
            <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
              <div className="relative">
                <img
                  src={p.user.avatar}
                  alt={p.user.username}
                  className={`${isSmall ? 'w-8 h-8' : 'w-12 h-12'} rounded-full object-cover`}
                />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-discord-red text-white animate-pulse">
                  AO VIVO
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startWatchingStream(p.socketId);
                }}
                className="px-2.5 py-1 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded text-xs font-semibold flex items-center space-x-1 shadow transition"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="text-[11px]">Assistir</span>
              </button>
            </div>
          )
        ) : showCamera ? (
          <StreamVideo
            stream={p.cameraStream}
            mirrored={p.isLocal}
            className="w-full h-full object-cover object-center"
            onAspectRatioChange={(isPort, ratio) => handleStreamAspectChange(p.socketId, isPort, ratio)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <img
              src={p.user.avatar}
              alt={p.user.username}
              className={`${
                isSmall ? 'w-8 h-8 sm:w-10 sm:h-10' : isHero ? 'w-20 h-20 sm:w-28 sm:h-28' : 'w-14 h-14 sm:w-20 sm:h-20'
              } rounded-full object-cover transition-all duration-150 ${
                isSpeakingUser
                  ? 'ring-4 ring-discord-green scale-105 shadow-[0_0_20px_#23a55a]'
                  : 'ring-2 ring-transparent'
              }`}
            />
          </div>
        )}

        {/* Name Tag & Badges Overlay */}
        <div className={`absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-white ${
          isSmall ? 'text-[9px]' : 'text-xs'
        }`}>
          <span className="truncate font-medium">
            {p.user.username} {p.isLocal ? '(Você)' : ''}
          </span>
          <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
            {p.isMuted && <MicOff className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-discord-red`} />}
            {p.isDeafened && <VolumeX className={`${isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-discord-red`} />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={stageContainerRef}
      onMouseMove={handleMouseMove}
      className="flex-1 h-full bg-discord-darkest flex flex-col relative select-none overflow-hidden"
    >
      {/* Top Header of Call Stage */}
      <div className="h-12 px-3 sm:px-4 bg-discord-darkest/90 backdrop-blur border-b border-discord-floating flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 truncate">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={toggleMobileNav}
            title="Abrir Menu de Servidores e Canais"
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-discord-darkhover text-discord-header transition flex-shrink-0 active:scale-95 flex items-center justify-center"
            aria-label="Abrir Menu de Servidores"
          >
            <Menu className="w-5 h-5 text-discord-header" />
          </button>

          <div className="flex items-center space-x-2 text-discord-header font-semibold text-sm truncate">
            <Radio className="w-4 h-4 text-discord-green animate-pulse flex-shrink-0" />
            <span className="truncate">{currentVoiceChannel?.name || 'Canal de Voz & Vídeo'}</span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-discord-green/10 border border-discord-green/30 text-discord-green text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-discord-green animate-ping" />
            <span>RTC Conectado • 1080p 60fps</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Download App Button */}
          <button
            onClick={openDownloadModal}
            className="px-2.5 py-1 rounded bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow mr-1"
            title="Baixar IglooChat para Desktop / Mobile"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baixar App</span>
          </button>

          {/* Layout Mode Toggle */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'focus' ? 'grid' : 'focus')}
            title={layoutMode === 'focus' ? 'Alternar para Modo Grade' : 'Alternar para Modo Foco'}
            className="px-2.5 py-1 rounded bg-discord-darker hover:bg-discord-darkhover border border-discord-floating text-discord-header hover:text-white transition text-xs flex items-center space-x-1.5"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="font-medium hidden sm:inline">
              {layoutMode === 'focus' ? 'Modo Grade' : 'Modo Foco'}
            </span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleGlobalFullscreen}
            title="Alternar Tela Cheia da Sala"
            className="p-1.5 rounded hover:bg-discord-darkhover text-discord-muted hover:text-white transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Switch back to Chat View without leaving call */}
          <button
            onClick={() => setActiveStageView('chat')}
            title="Minimizar Palco de Voz (Voltar ao Chat)"
            className="p-1.5 rounded hover:bg-discord-darkhover text-discord-muted hover:text-white transition flex items-center space-x-1"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Chat</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 p-2 sm:p-4 overflow-hidden flex flex-col justify-center items-center relative w-full">
        {/* CASE 1: FOCUS MODE WITH ACTIVE SCREEN SHARE */}
        {layoutMode === 'focus' && hasActiveScreenShare && featuredScreenStream ? (
          <div className="w-full h-full flex flex-col gap-2 sm:gap-3 items-center justify-center">
            {/* Screen Share Theatre */}
            <div 
              ref={screenTheatreRef}
              onMouseMove={handleMouseMove}
              className={`flex-1 w-full max-h-[72vh] aspect-video relative bg-black rounded-xl overflow-hidden shadow-2xl border border-discord-floating flex items-center justify-center group ${
                isFullscreen && !showControls ? 'cursor-none' : ''
              }`}
            >
              {isFeaturedWatching ? (
                <>
                  <StreamVideo stream={featuredScreenStream} className="object-contain w-full h-full" />

                  {/* Top Bar HUD */}
                  <div className={`absolute top-3 left-3 right-3 flex items-center justify-between transition-opacity duration-300 z-30 ${
                    isFullscreen ? (showControls ? 'opacity-100' : 'opacity-0 pointer-events-none') : 'opacity-100'
                  }`}>
                    <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-discord-red text-white tracking-wider flex items-center space-x-1 animate-pulse">
                        <Tv className="w-3 h-3" />
                        <span>AO VIVO</span>
                      </span>
                      <span className="text-white text-xs font-medium truncate max-w-[150px] sm:max-w-[240px]">
                        {featuredScreenOwner}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg">
                      {featuredScreenSocketId !== 'local' && (
                        <button
                          onClick={() => stopWatchingStream(featuredScreenSocketId)}
                          title="Sair da Transmissão"
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-discord-red/80 hover:bg-discord-red text-white text-xs font-semibold transition shadow"
                        >
                          <MonitorOff className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sair da Transmissão</span>
                        </button>
                      )}

                      <button
                        onClick={toggleTheaterFullscreen}
                        title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                        className="p-1.5 rounded hover:bg-white/20 text-white transition flex items-center space-x-1"
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span className="text-xs font-medium hidden sm:inline">
                          {isFullscreen ? 'Restaurar' : 'Tela Cheia'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Bar HUD */}
                  <div className={`absolute bottom-3 left-3 right-3 flex items-center justify-between transition-opacity duration-300 z-30 ${
                    isFullscreen ? (showControls ? 'opacity-100' : 'opacity-0 pointer-events-none') : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    {featuredScreenSocketId !== 'local' ? (
                      <div className="flex items-center space-x-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white shadow-lg">
                        <button
                          onClick={() => toggleStreamMute(featuredScreenSocketId)}
                          title={isActiveStreamMuted ? 'Desmutar Transmissão' : 'Mutar Transmissão'}
                          className="p-1 rounded hover:bg-white/20 transition"
                        >
                          {isActiveStreamMuted ? (
                            <VolumeX className="w-4 h-4 text-discord-red" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-discord-green" />
                          )}
                        </button>

                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={isActiveStreamMuted ? 0 : activeStreamVolume}
                            onChange={(e) => setStreamVolume(featuredScreenSocketId, Number(e.target.value))}
                            className="w-20 sm:w-28 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-discord-blurple"
                            title={`Volume: ${activeStreamVolume}%`}
                          />
                          <span className="text-[11px] font-mono text-gray-300 w-9">
                            {isActiveStreamMuted ? '0%' : `${activeStreamVolume}%`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-medium">
                        Você está transmitindo sua tela
                      </div>
                    )}

                    <div className="bg-black/75 backdrop-blur-md text-[11px] font-mono text-discord-normal px-2.5 py-1 rounded-lg border border-white/10">
                      1920x1080 @ 60 FPS
                    </div>
                  </div>
                </>
              ) : (
                /* Opt-in Prompt */
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-discord-blurple/20 border-2 border-discord-blurple flex items-center justify-center text-discord-blurple shadow-2xl">
                      <Tv className="w-8 h-8 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-discord-red text-white animate-pulse">
                      AO VIVO
                    </span>
                  </div>

                  <div>
                    <h3 className="text-white text-base sm:text-lg font-bold">
                      {featuredScreenOwner} está transmitindo a tela
                    </h3>
                    <p className="text-discord-muted text-xs mt-1">
                      Conecte-se para assistir em tempo real com áudio e vídeo HD 1080p 60 FPS.
                    </p>
                  </div>

                  <button
                    onClick={() => startWatchingStream(featuredScreenSocketId)}
                    className="px-5 py-2 rounded-lg bg-discord-blurple hover:bg-discord-blurple-hover text-white font-semibold text-sm transition flex items-center space-x-2 shadow-xl hover:scale-105 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Assistir Transmissão</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom filmstrip */}
            {!isFullscreen && (
              <div className="h-20 sm:h-24 flex items-center justify-center space-x-2 sm:space-x-3 overflow-x-auto py-1 scrollbar-none flex-shrink-0 w-full">
                {allParticipants.map(p => renderParticipantTile(p, true))}
              </div>
            )}
          </div>
        ) : layoutMode === 'focus' && heroParticipant ? (
          /* CASE 2: FOCUS MODE WITHOUT SCREEN SHARE (HERO + FILMSTRIP) */
          <div className="w-full h-full flex flex-col gap-2 sm:gap-3 items-center justify-center">
            {/* Hero card auto-adjusts to portrait if mobile or widescreen landscape if PC */}
            <div className={`flex-1 w-auto max-h-[70vh] flex items-center justify-center ${
              checkIsPortrait(heroParticipant) ? 'aspect-[9/16] sm:aspect-[3/4]' : 'w-full max-w-4xl aspect-video'
            }`}>
              {renderParticipantTile(heroParticipant, false, true)}
            </div>

            {/* Bottom filmstrip of all participants */}
            {allParticipants.length > 1 && (
              <div className="h-20 sm:h-24 flex items-center justify-center space-x-2 sm:space-x-3 overflow-x-auto py-1 scrollbar-none flex-shrink-0 w-full">
                {allParticipants.map(p => renderParticipantTile(p, true))}
              </div>
            )}
          </div>
        ) : (
          /* CASE 3: AUTO-ADJUSTING ADAPTIVE GRID FOR PC & MOBILE CAMERAS */
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-y-auto scrollbar-none">
            {allParticipants.length === 1 ? (
              <div className={`mx-auto flex items-center justify-center ${
                checkIsPortrait(allParticipants[0])
                  ? 'w-auto h-full max-h-[72vh] aspect-[9/16] sm:aspect-[3/4]'
                  : 'w-full max-w-3xl aspect-video'
              }`}>
                {renderParticipantTile(allParticipants[0])}
              </div>
            ) : (
              <div className="w-full h-full flex flex-wrap items-center justify-center content-center gap-3 sm:gap-4 max-w-6xl mx-auto">
                {allParticipants.map(p => {
                  const isPortrait = checkIsPortrait(p);
                  const isScreen = p.isScreenSharing && p.screenStream;

                  return (
                    <div
                      key={p.socketId}
                      className={`flex items-center justify-center transition-all duration-200 ${
                        isScreen
                          ? 'w-full sm:w-auto flex-1 min-w-[280px] max-w-[640px] max-h-[38vh] sm:max-h-[48vh] md:max-h-[60vh] aspect-video'
                          : isPortrait
                          ? 'w-auto h-full max-h-[38vh] sm:max-h-[48vh] md:max-h-[60vh] aspect-[9/16] sm:aspect-[3/4] flex-shrink-0'
                          : allParticipants.length === 2
                          ? 'w-full sm:w-auto flex-1 min-w-[280px] max-w-[560px] max-h-[42vh] sm:max-h-[52vh] md:max-h-[65vh] aspect-video'
                          : allParticipants.length <= 4
                          ? 'w-full sm:w-auto flex-1 min-w-[240px] max-w-[480px] max-h-[36vh] sm:max-h-[46vh] aspect-video'
                          : 'w-full sm:w-auto flex-1 min-w-[200px] max-w-[380px] max-h-[30vh] sm:max-h-[40vh] aspect-video'
                      }`}
                    >
                      {renderParticipantTile(p)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Control Dock (Discord signature pill bar) */}
      <div className={`h-16 sm:h-20 flex items-center justify-center z-30 pb-2 px-2 flex-shrink-0 transition-opacity duration-300 ${
        isFullscreen ? (showControls ? 'opacity-100' : 'opacity-0 pointer-events-none') : 'opacity-100'
      }`}>
        <div className="bg-discord-floating/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl border border-discord-darkhover flex items-center space-x-2 sm:space-x-3 max-w-full overflow-x-auto scrollbar-none">
          {/* Camera Button */}
          <button
            onClick={toggleVideo}
            title={isVideoOn ? 'Desligar Câmera' : 'Ligar Câmera'}
            className={`p-2.5 sm:p-3 rounded-full transition flex items-center justify-center ${
              isVideoOn 
                ? 'bg-white text-discord-darkest hover:bg-gray-200 shadow-md' 
                : 'bg-discord-darker text-discord-header hover:bg-discord-darkhover'
            }`}
          >
            {isVideoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* SCREEN SHARING BUTTON */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Parar Compartilhamento de Tela' : 'Compartilhar sua Tela'}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-full font-semibold text-xs transition flex items-center space-x-1.5 sm:space-x-2 shadow-lg ${
              isScreenSharing
                ? 'bg-discord-green text-white hover:bg-emerald-600 ring-2 ring-emerald-400/50'
                : 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
            }`}
          >
            {isScreenSharing ? (
              <>
                <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                <span className="hidden xs:inline">Parar Tela</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Compartilhar Tela</span>
              </>
            )}
          </button>

          {/* Microphone Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
            className={`p-2.5 sm:p-3 rounded-full transition flex items-center justify-center ${
              isMuted 
                ? 'bg-discord-red text-white hover:bg-red-600' 
                : 'bg-discord-darker text-discord-header hover:bg-discord-darkhover'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Deafen Toggle */}
          <button
            onClick={toggleDeafen}
            title={isDeafened ? 'Ativar Som' : 'Ensurdecer'}
            className={`p-2.5 sm:p-3 rounded-full transition flex items-center justify-center ${
              isDeafened 
                ? 'bg-discord-red text-white hover:bg-red-600' 
                : 'bg-discord-darker text-discord-header hover:bg-discord-darkhover'
            }`}
          >
            {isDeafened ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Noise Suppression Toggle (Krisp) */}
          <button
            onClick={toggleNoiseSuppression}
            title={isNoiseSuppressionEnabled ? 'Supressão de Ruído Ativada (Krisp)' : 'Supressão de Ruído Desativada'}
            className={`p-2.5 sm:p-3 rounded-full transition flex items-center justify-center ${
              isNoiseSuppressionEnabled
                ? 'bg-discord-green/20 text-discord-green border border-discord-green/40 hover:bg-discord-green/30'
                : 'bg-discord-darker text-discord-muted hover:text-white hover:bg-discord-darkhover'
            }`}
          >
            <AudioWaveform className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="w-[1px] h-6 bg-discord-darkhover" />

          {/* Disconnect Red Button */}
          <button
            onClick={leaveVoiceChannel}
            title="Desconectar da Chamada"
            className="p-2.5 sm:p-3 rounded-full bg-discord-red hover:bg-red-600 text-white transition flex items-center justify-center shadow-lg"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
