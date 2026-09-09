import React, { useEffect, useRef } from 'react';
import { useIglooChat } from '../context/IglooChatContext';

interface SingleAudioPlayerProps {
  stream?: MediaStream | null;
  isMuted: boolean;
  volume: number;
}

const SingleAudioPlayer: React.FC<SingleAudioPlayerProps> = ({ stream, isMuted, volume }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !stream) return;

    if (audio.srcObject !== stream) {
      audio.srcObject = stream;
    }

    audio.muted = isMuted;
    audio.volume = isMuted ? 0 : Math.max(0, Math.min(1.0, volume));

    try {
      const outputId = localStorage.getItem('igloochat_audio_output_id');
      if (outputId && typeof (audio as any).setSinkId === 'function') {
        (audio as any).setSinkId(outputId).catch(() => {});
      }
    } catch (e) {}

    const playSafe = () => {
      audio.play().catch(e => {
        console.warn('[RemoteAudioContainer] Autoplay policy prevented playback until interaction:', e.message);
      });
    };

    playSafe();

    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(t => {
      t.onunmute = playSafe;
    });

    return () => {
      audioTracks.forEach(t => {
        t.onunmute = null;
      });
    };
  }, [stream, isMuted, volume]);

  if (!stream || stream.getAudioTracks().length === 0) return null;

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      className="hidden"
    />
  );
};

export const RemoteAudioContainer: React.FC = () => {
  const {
    remoteStreams,
    voiceParticipants,
    isDeafened,
    userAudioSettings,
    isWatchingStream,
    streamAudioSettings
  } = useIglooChat();

  return (
    <div className="hidden pointer-events-none" aria-hidden="true">
      {Object.entries(remoteStreams).map(([socketId, streams]) => {
        const participant = voiceParticipants.find(p => p.socketId === socketId);
        const userId = participant?.user?.id;
        const settings = userId ? userAudioSettings[userId] : null;

        const isUserLocallyMuted = isDeafened || (settings ? settings.muted : false);
        const userVolume = (settings ? (settings.volume ?? 100) : 100) / 100;

        // Stream audio controls (Watching status & specific stream volume)
        const isStreamWatching = isWatchingStream(socketId);
        const streamSetting = streamAudioSettings[socketId];
        const isStreamMuted = isDeafened || !isStreamWatching || (streamSetting ? streamSetting.muted : false);
        const streamVol = (streamSetting ? (streamSetting.volume ?? 100) : 100) / 100;

        return (
          <React.Fragment key={socketId}>
            {/* Microphone audio from peer cameraStream */}
            {streams.cameraStream && (
              <SingleAudioPlayer
                stream={streams.cameraStream}
                isMuted={isUserLocallyMuted}
                volume={userVolume}
              />
            )}

            {/* System or tab audio from peer screenStream */}
            {streams.screenStream && (
              <SingleAudioPlayer
                stream={streams.screenStream}
                isMuted={isStreamMuted}
                volume={streamVol}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
