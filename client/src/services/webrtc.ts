import { socket } from './socket';
import { audioFX } from './audioEffects';

export interface WebRTCCallbacks {
  onRemoteStream: (socketId: string, stream: MediaStream, streamType: 'camera' | 'screen') => void;
  onRemoteStreamRemoved: (socketId: string, streamType: 'camera' | 'screen') => void;
  onSpeakingChanged: (isSpeaking: boolean) => void;
  onScreenShareEnded: () => void;
}

// Resilient default ICE & TURN configuration with authenticated Metered relay servers
let activeIceConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: '9264d51bf7b61ba6f3c250bd',
      credential: 'wNe5ZCN1gAGNqtmK'
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: '9264d51bf7b61ba6f3c250bd',
      credential: 'wNe5ZCN1gAGNqtmK'
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: '9264d51bf7b61ba6f3c250bd',
      credential: 'wNe5ZCN1gAGNqtmK'
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: '9264d51bf7b61ba6f3c250bd',
      credential: 'wNe5ZCN1gAGNqtmK'
    }
  ],
  iceCandidatePoolSize: 10
};

// Fetch dynamic TURN credentials from server proxy
async function loadDynamicIceServers() {
  try {
    const res = await fetch('/api/webrtc/ice-servers');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        activeIceConfig = {
          iceServers: data.iceServers,
          iceCandidatePoolSize: 10
        };
        console.log(`[WebRTC] ${data.iceServers.length} servidores ICE/TURN carregados dinamicamente com sucesso.`);
      }
    }
  } catch (err) {
    console.warn('[WebRTC] Usando servidores ICE/TURN de fallback:', err);
  }
}

loadDynamicIceServers();

export class WebRTCManager {
  private rawAudioStream: MediaStream | null = null;
  private localAudioStream: MediaStream | null = null;
  private localVideoStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;

  // peerId -> RTCPeerConnection
  private peers: Map<string, RTCPeerConnection> = new Map();
  private screenPeers: Map<string, RTCPeerConnection> = new Map();
  // key: `${socketId}_${streamType}` -> MediaStream
  private remoteStreamsMap: Map<string, MediaStream> = new Map();
  // key: `${socketId}_${streamType}` -> RTCIceCandidateInit[]
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  // DSP Web Audio API Pipeline (Highpass, Notch, Compressor, Noise Gate)
  private dspAudioCtx: AudioContext | null = null;
  private dspSource: MediaStreamAudioSourceNode | null = null;
  private dspHighpass: BiquadFilterNode | null = null;
  private dspNotch: BiquadFilterNode | null = null;
  private dspCompressor: DynamicsCompressorNode | null = null;
  private dspGateGain: GainNode | null = null;
  private dspDestination: MediaStreamAudioDestinationNode | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: any = null;
  private vadAudioPrime: HTMLAudioElement | null = null;

  private dspLowpass: BiquadFilterNode | null = null;
  private micSensitivity: number = 40; // 0 to 100
  private ambientNoiseFloor: number = 0.005;
  private currentMicLevel: number = 0;

  private isSpeaking = false;
  private selectedAudioInputId: string | null = null;
  private selectedAudioOutputId: string | null = null;
  private selectedVideoInputId: string | null = null;
  private noiseSuppressionEnabled: boolean = true;
  private callbacks: WebRTCCallbacks;

  constructor(callbacks: WebRTCCallbacks) {
    this.callbacks = callbacks;
    this.setupSignalingListeners();
    try {
      this.selectedAudioInputId = localStorage.getItem('concord_audio_input_id');
      this.selectedAudioOutputId = localStorage.getItem('concord_audio_output_id');
      this.selectedVideoInputId = localStorage.getItem('concord_video_input_id');
      this.noiseSuppressionEnabled = localStorage.getItem('concord_noise_suppression') !== 'false';
      const sens = localStorage.getItem('concord_mic_sensitivity');
      if (sens !== null) this.micSensitivity = parseInt(sens, 10);
    } catch (e) {}
  }

  setMicSensitivity(val: number) {
    this.micSensitivity = Math.max(0, Math.min(100, val));
    try { localStorage.setItem('concord_mic_sensitivity', val.toString()); } catch (e) {}
  }

  getMicSensitivity(): number {
    return this.micSensitivity;
  }

  getCurrentMicLevel(): number {
    return this.currentMicLevel;
  }

  removeRemoteStream(socketId: string, streamType: 'camera' | 'screen') {
    const streamKey = `${socketId}_${streamType}`;
    const stream = this.remoteStreamsMap.get(streamKey);
    if (stream) {
      stream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      this.remoteStreamsMap.delete(streamKey);
    }
    this.callbacks.onRemoteStreamRemoved(socketId, streamType);
  }

  setAudioInputDevice(deviceId: string) {
    this.selectedAudioInputId = deviceId;
    try { localStorage.setItem('concord_audio_input_id', deviceId); } catch (e) {}
    if (this.rawAudioStream) {
      this.stopMicrophone();
      this.startMicrophone();
    }
  }

  setAudioOutputDevice(deviceId: string) {
    this.selectedAudioOutputId = deviceId;
    try { localStorage.setItem('concord_audio_output_id', deviceId); } catch (e) {}
  }

  setVideoInputDevice(deviceId: string) {
    this.selectedVideoInputId = deviceId;
    try { localStorage.setItem('concord_video_input_id', deviceId); } catch (e) {}
    if (this.localVideoStream) {
      this.stopCamera();
      this.startCamera();
    }
  }

  setNoiseSuppression(enabled: boolean) {
    this.noiseSuppressionEnabled = enabled;
    try { localStorage.setItem('concord_noise_suppression', enabled ? 'true' : 'false'); } catch (e) {}

    // Instantly adjust DSP filters and gate gain if active
    if (this.dspAudioCtx) {
      const now = this.dspAudioCtx.currentTime;
      if (this.dspLowpass) {
        this.dspLowpass.frequency.setTargetAtTime(enabled ? 7000 : 20000, now, 0.05);
      }
      if (this.dspHighpass) {
        this.dspHighpass.frequency.setTargetAtTime(enabled ? 95 : 40, now, 0.05);
      }
      if (this.dspGateGain) {
        if (!enabled) {
          this.dspGateGain.gain.setTargetAtTime(1.0, now, 0.01);
        }
      }
    }
  }

  isNoiseSuppression(): boolean {
    return this.noiseSuppressionEnabled;
  }

  // =====================================
  // LOCAL MEDIA CAPTURE WITH DSP NOISE GATE
  // =====================================

  async startMicrophone(inputDeviceId?: string): Promise<MediaStream | null> {
    try {
      if (this.localAudioStream) return this.localAudioStream;

      const deviceId = inputDeviceId || this.selectedAudioInputId || localStorage.getItem('concord_audio_input_id');
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: !this.noiseSuppressionEnabled
      };
      if (deviceId && deviceId !== 'default') {
        audioConstraints.deviceId = { exact: deviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false
      });

      this.rawAudioStream = stream;

      // Setup Web Audio API DSP Noise Gate and Vocal Equalization
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.dspAudioCtx = new AudioCtx();
      if (this.dspAudioCtx.state === 'suspended') {
        await this.dspAudioCtx.resume().catch(() => {});
      }

      // Hidden audio element to keep audio stream active and clocking in Chromium
      if (!this.vadAudioPrime) {
        this.vadAudioPrime = document.createElement('audio');
        this.vadAudioPrime.muted = true;
      }
      this.vadAudioPrime.srcObject = stream;
      this.vadAudioPrime.play().catch(() => {});

      this.dspSource = this.dspAudioCtx.createMediaStreamSource(stream);

      // 1. High-Pass Filter at 95 Hz (eliminates desk rumble, AC hum, low frequency thuds)
      this.dspHighpass = this.dspAudioCtx.createBiquadFilter();
      this.dspHighpass.type = 'highpass';
      this.dspHighpass.frequency.value = this.noiseSuppressionEnabled ? 95 : 40;
      this.dspHighpass.Q.value = 0.707;

      // 2. Notch Filter at 60 Hz (removes electrical mains buzz)
      this.dspNotch = this.dspAudioCtx.createBiquadFilter();
      this.dspNotch.type = 'notch';
      this.dspNotch.frequency.value = 60;
      this.dspNotch.Q.value = 3.0;

      // 3. Dynamics Compressor (evens out vocal levels, gives broadcast clarity)
      this.dspCompressor = this.dspAudioCtx.createDynamicsCompressor();
      this.dspCompressor.threshold.value = -24;
      this.dspCompressor.knee.value = 12;
      this.dspCompressor.ratio.value = 3;
      this.dspCompressor.attack.value = 0.003;
      this.dspCompressor.release.value = 0.25;

      // 4. Low-Pass Filter at 7000 Hz (eliminates high-frequency fan hiss, keyboard clatter, mouse clicks)
      this.dspLowpass = this.dspAudioCtx.createBiquadFilter();
      this.dspLowpass.type = 'lowpass';
      this.dspLowpass.frequency.value = this.noiseSuppressionEnabled ? 7000 : 20000;
      this.dspLowpass.Q.value = 0.707;

      // 5. Noise Gate Gain Node
      this.dspGateGain = this.dspAudioCtx.createGain();
      this.dspGateGain.gain.value = 1.0;

      // 6. Analyser for Real-Time RMS VAD & Noise Detection
      this.analyser = this.dspAudioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.15;

      // 7. MediaStream Destination (processed stream for WebRTC transmission)
      this.dspDestination = this.dspAudioCtx.createMediaStreamDestination();

      // Connect DSP chain: source -> highpass -> notch -> compressor -> lowpass -> gateGain -> destination
      this.dspSource.connect(this.dspHighpass);
      this.dspHighpass.connect(this.dspNotch);
      this.dspNotch.connect(this.dspCompressor);
      this.dspCompressor.connect(this.dspLowpass);
      this.dspLowpass.connect(this.dspGateGain);
      this.dspGateGain.connect(this.dspDestination);

      // Analyser branch for RMS level calculation (post-compressor for steady metering)
      this.dspCompressor.connect(this.analyser);

      this.localAudioStream = this.dspDestination.stream;

      // Start Noise Gate & VAD Loop
      this.startDSPNoiseGateLoop();

      // Transmit processed audio to existing WebRTC peers
      this.addTracksToPeers(this.localAudioStream, this.peers, 'camera');

      return this.localAudioStream;
    } catch (err) {
      console.warn('[WebRTC] Permissão de microfone negada ou indisponível:', err);
      return null;
    }
  }

  private startDSPNoiseGateLoop() {
    if (!this.analyser || !this.dspAudioCtx) return;

    const dataArray = new Uint8Array(this.analyser.fftSize);
    let hangoverCounter = 0;
    const HANGOVER_TICKS = 8; // ~280ms hold time to preserve word endings

    this.vadInterval = setInterval(() => {
      if (!this.analyser || !this.dspAudioCtx || !this.dspGateGain) return;

      this.analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const norm = (dataArray[i] - 128) / 128;
        sum += norm * norm;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      this.currentMicLevel = Math.min(100, Math.round(rms * 400));

      // Continuously adapt ambient room noise floor during quiet moments
      if (rms < 0.035) {
        this.ambientNoiseFloor = this.ambientNoiseFloor * 0.95 + rms * 0.05;
      }

      // Dynamic sensitivity threshold
      // Scale: 0 (most sensitive) to 100 (gate opens only for strong speaking)
      const sensitivityMultiplier = 1.3 + (this.micSensitivity / 100) * 2.5;
      const minThreshold = 0.007 + (this.micSensitivity / 100) * 0.03;
      const effectiveThreshold = Math.max(this.ambientNoiseFloor * sensitivityMultiplier, minThreshold);

      const isVoiceEnergy = rms > effectiveThreshold;

      if (isVoiceEnergy) {
        hangoverCounter = HANGOVER_TICKS;
      } else if (hangoverCounter > 0) {
        hangoverCounter--;
      }

      const activeSpeaking = hangoverCounter > 0;

      // Handle Noise Gate Attenuation
      if (this.noiseSuppressionEnabled) {
        const targetGain = activeSpeaking ? 1.0 : 0.0001; // -80dB downward expansion for pure silence
        const timeConstant = activeSpeaking ? 0.005 : 0.035; // Fast 5ms attack, smooth 35ms decay
        this.dspGateGain.gain.setTargetAtTime(targetGain, this.dspAudioCtx.currentTime, timeConstant);
      } else {
        this.dspGateGain.gain.setTargetAtTime(1.0, this.dspAudioCtx.currentTime, 0.01);
      }

      if (this.isSpeaking !== activeSpeaking) {
        this.isSpeaking = activeSpeaking;
        this.callbacks.onSpeakingChanged(activeSpeaking);
      }
    }, 35);
  }

  stopMicrophone() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }

    if (this.vadAudioPrime) {
      this.vadAudioPrime.pause();
      this.vadAudioPrime.srcObject = null;
    }

    if (this.rawAudioStream) {
      this.rawAudioStream.getTracks().forEach(t => t.stop());
      this.rawAudioStream = null;
    }

    if (this.localAudioStream) {
      this.removeTracksFromPeers(this.localAudioStream, this.peers);
      this.localAudioStream.getTracks().forEach(t => t.stop());
      this.localAudioStream = null;
    }

    if (this.dspAudioCtx) {
      this.dspAudioCtx.close().catch(() => {});
      this.dspAudioCtx = null;
      this.dspSource = null;
      this.dspGateGain = null;
      this.dspDestination = null;
      this.analyser = null;
    }

    this.isSpeaking = false;
    this.callbacks.onSpeakingChanged(false);
  }

  setMicrophoneMuted(muted: boolean) {
    if (this.rawAudioStream) {
      this.rawAudioStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  async startCamera(videoDeviceId?: string): Promise<MediaStream | null> {
    try {
      if (this.localVideoStream) return this.localVideoStream;
      const devId = videoDeviceId || this.selectedVideoInputId || localStorage.getItem('concord_video_input_id');
      const constraints: MediaStreamConstraints = {
        video: devId && devId !== 'default'
          ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: devId && devId !== 'default' ? { deviceId: { exact: devId } } : true,
          audio: false
        });
      }

      this.localVideoStream = stream;
      this.addTracksToPeers(stream, this.peers, 'camera');
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Permissão de câmera negada ou indisponível:', err);
      return null;
    }
  }

  stopCamera() {
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach(t => t.stop());
      this.removeTracksFromPeers(this.localVideoStream, this.peers);
      this.localVideoStream = null;
    }
  }

  // =====================================
  // SCREEN SHARING WITH DESKTOP & TAB AUDIO
  // =====================================

  async startScreenShare(): Promise<MediaStream | null> {
    try {
      if (this.localScreenStream) return this.localScreenStream;

      let stream: MediaStream;
      const concordDesktop = (window as any).concordDesktop;

      // If running inside Electron desktop app, capture native system sources with loopback audio
      if (concordDesktop && typeof concordDesktop.getScreenSources === 'function') {
        const sources = await concordDesktop.getScreenSources();
        const primarySource = sources && sources.length > 0 ? sources[0] : null;
        if (primarySource && primarySource.id) {
          stream = await (navigator.mediaDevices as any).getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSource: 'desktop'
              }
            },
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: primarySource.id,
                minWidth: 1280,
                maxWidth: 1920,
                minHeight: 720,
                maxHeight: 1080,
                frameRate: { ideal: 30, max: 60 }
              }
            }
          });
        } else {
          // Fallback to standard getDisplayMedia if no desktop source returned
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              frameRate: { ideal: 30, max: 60 }
            },
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 2
            }
          });
        }
      } else {
        // Standard Web Browser Screen Capture
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: { ideal: 30, max: 60 }
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 2
          }
        });
      }

      this.localScreenStream = stream;
      audioFX.playScreenShareStart();

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopScreenShare();
          this.callbacks.onScreenShareEnded();
        };
      }

      this.addTracksToPeers(stream, this.screenPeers, 'screen');
      this.renegotiateScreenWithAllPeers();

      return stream;
    } catch (err) {
      console.warn('[WebRTC] Compartilhamento de tela cancelado ou negado:', err);
      return null;
    }
  }

  stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(t => t.stop());
      this.removeTracksFromPeers(this.localScreenStream, this.screenPeers);
      this.localScreenStream = null;
      audioFX.playScreenShareStop();
    }
  }

  getLocalScreenStream(): MediaStream | null {
    return this.localScreenStream;
  }

  getLocalVideoStream(): MediaStream | null {
    return this.localVideoStream;
  }

  getLocalAudioStream(): MediaStream | null {
    return this.localAudioStream;
  }

  // =====================================
  // PEER CONNECTION MANAGEMENT
  // =====================================

  createPeerConnection(targetSocketId: string, streamType: 'camera' | 'screen'): RTCPeerConnection {
    const pc = new RTCPeerConnection(activeIceConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice_candidate', {
          toSocketId: targetSocketId,
          candidate: event.candidate,
          streamType
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE Connection State [${targetSocketId}][${streamType}]:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] ICE falhou para [${targetSocketId}][${streamType}], tentando reiniciar ICE...`);
        try { pc.restartIce(); } catch (e) {}
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Recebeu track remoto (${event.track.kind}) de ${targetSocketId} [${streamType}]`);
      const streamKey = `${targetSocketId}_${streamType}`;
      let stream = this.remoteStreamsMap.get(streamKey);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreamsMap.set(streamKey, stream);
      }

      // Remove previous track of same kind if any to prevent duplicates
      const existing = stream.getTracks().filter(t => t.kind === event.track.kind);
      existing.forEach(t => stream!.removeTrack(t));
      stream.addTrack(event.track);

      // Listen to track unmuting (when first RTP packets arrive)
      event.track.onunmute = () => {
        console.log(`[WebRTC] Track unmuted (${event.track.kind}) de ${targetSocketId}`);
        const fresh = new MediaStream(stream!.getTracks());
        this.callbacks.onRemoteStream(targetSocketId, fresh, streamType);
      };

      // Notify callback with fresh MediaStream instance so React updates state immediately
      const freshStream = new MediaStream(stream.getTracks());
      this.callbacks.onRemoteStream(targetSocketId, freshStream, streamType);

      event.track.onended = () => {
        if (stream) stream.removeTrack(event.track);
        if (stream && stream.getTracks().length === 0) {
          this.remoteStreamsMap.delete(streamKey);
          this.callbacks.onRemoteStreamRemoved(targetSocketId, streamType);
        }
      };

      event.track.onmute = () => {
        if (streamType === 'screen') {
          console.log(`[WebRTC] Screen track muted from ${targetSocketId}`);
          this.callbacks.onRemoteStreamRemoved(targetSocketId, 'screen');
        }
      };
    };

    if (streamType === 'camera') {
      if (this.localAudioStream) {
        this.localAudioStream.getTracks().forEach(t => pc.addTrack(t, this.localAudioStream!));
      }
      if (this.localVideoStream) {
        this.localVideoStream.getTracks().forEach(t => pc.addTrack(t, this.localVideoStream!));
      }
      this.peers.set(targetSocketId, pc);
    } else {
      if (this.localScreenStream) {
        this.localScreenStream.getTracks().forEach(t => pc.addTrack(t, this.localScreenStream!));
      }
      this.screenPeers.set(targetSocketId, pc);
    }

    return pc;
  }

  async initiateCallToPeer(targetSocketId: string) {
    const cameraPC = this.createPeerConnection(targetSocketId, 'camera');
    try {
      const offer = await cameraPC.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await cameraPC.setLocalDescription(offer);
      socket.emit('webrtc:offer', {
        toSocketId: targetSocketId,
        offer,
        streamType: 'camera'
      });
    } catch (e) {
      console.error('[WebRTC] Erro ao criar offer de câmera:', e);
    }

    if (this.localScreenStream) {
      const screenPC = this.createPeerConnection(targetSocketId, 'screen');
      try {
        const screenOffer = await screenPC.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await screenPC.setLocalDescription(screenOffer);
        socket.emit('webrtc:offer', {
          toSocketId: targetSocketId,
          offer: screenOffer,
          streamType: 'screen'
        });
      } catch (e) {
        console.error('[WebRTC] Erro ao criar offer de tela:', e);
      }
    }
  }

  private async renegotiatePeer(targetSocketId: string, pc: RTCPeerConnection, streamType: 'camera' | 'screen') {
    try {
      if (pc.signalingState !== 'stable') return;
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:offer', {
        toSocketId: targetSocketId,
        offer,
        streamType
      });
    } catch (e) {
      console.error(`[WebRTC] Erro ao renegociar peer (${streamType}):`, e);
    }
  }

  private renegotiateScreenWithAllPeers() {
    for (const [targetSocketId, pc] of this.screenPeers.entries()) {
      this.renegotiatePeer(targetSocketId, pc, 'screen');
    }
    // Also invite peers that don't have screen connection yet
    for (const targetSocketId of this.peers.keys()) {
      if (!this.screenPeers.has(targetSocketId)) {
        const screenPC = this.createPeerConnection(targetSocketId, 'screen');
        screenPC.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then(offer => screenPC.setLocalDescription(offer).then(() => offer))
          .then(offer => {
            socket.emit('webrtc:offer', {
              toSocketId: targetSocketId,
              offer,
              streamType: 'screen'
            });
          })
          .catch(e => console.error('[WebRTC] Erro ao criar offer de tela:', e));
      }
    }
  }

  private addTracksToPeers(stream: MediaStream, peerMap: Map<string, RTCPeerConnection>, streamType: 'camera' | 'screen' = 'camera') {
    for (const [targetSocketId, pc] of peerMap.entries()) {
      let addedAny = false;
      stream.getTracks().forEach(track => {
        const senders = pc.getSenders();
        const alreadyAdded = senders.some(s => s.track && s.track.id === track.id);
        if (!alreadyAdded) {
          pc.addTrack(track, stream);
          addedAny = true;
        }
      });
      if (addedAny && pc.signalingState === 'stable') {
        this.renegotiatePeer(targetSocketId, pc, streamType);
      }
    }
  }

  private removeTracksFromPeers(stream: MediaStream, peerMap: Map<string, RTCPeerConnection>) {
    for (const pc of peerMap.values()) {
      const senders = pc.getSenders();
      stream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track && s.track.id === track.id);
        if (sender) {
          pc.removeTrack(sender);
        }
      });
    }
  }

  removePeer(socketId: string) {
    if (this.peers.has(socketId)) {
      this.peers.get(socketId)?.close();
      this.peers.delete(socketId);
      this.remoteStreamsMap.delete(`${socketId}_camera`);
      this.pendingCandidates.delete(`${socketId}_camera`);
      this.callbacks.onRemoteStreamRemoved(socketId, 'camera');
    }
    if (this.screenPeers.has(socketId)) {
      this.screenPeers.get(socketId)?.close();
      this.screenPeers.delete(socketId);
      this.remoteStreamsMap.delete(`${socketId}_screen`);
      this.pendingCandidates.delete(`${socketId}_screen`);
      this.callbacks.onRemoteStreamRemoved(socketId, 'screen');
    }
  }

  cleanupAll() {
    this.stopMicrophone();
    this.stopCamera();
    this.stopScreenShare();

    for (const pc of this.peers.values()) pc.close();
    for (const pc of this.screenPeers.values()) pc.close();
    this.peers.clear();
    this.screenPeers.clear();
    this.remoteStreamsMap.clear();
    this.pendingCandidates.clear();
  }

  // =====================================
  // SIGNALING DISPATCHER & ICE BUFFERING
  // =====================================

  private async drainPendingCandidates(peerKey: string, pc: RTCPeerConnection) {
    const queue = this.pendingCandidates.get(peerKey);
    if (queue && queue.length > 0) {
      console.log(`[WebRTC] Drenando ${queue.length} ICE candidates em buffer para ${peerKey}`);
      for (const cand of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('[WebRTC] Erro ao aplicar ICE candidate pendente:', e);
        }
      }
      this.pendingCandidates.delete(peerKey);
    }
  }

  private setupSignalingListeners() {
    socket.on('webrtc:offer', async ({ fromSocketId, offer, streamType }) => {
      try {
        console.log(`[WebRTC] Recebeu offer de ${fromSocketId} (${streamType})`);
        const peerKey = `${fromSocketId}_${streamType}`;
        const peerMap = streamType === 'screen' ? this.screenPeers : this.peers;
        let pc = peerMap.get(fromSocketId);
        if (!pc) {
          pc = this.createPeerConnection(fromSocketId, streamType);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await this.drainPendingCandidates(peerKey, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          toSocketId: fromSocketId,
          answer,
          streamType
        });
      } catch (e) {
        console.error('[WebRTC] Erro processando offer:', e);
      }
    });

    socket.on('webrtc:answer', async ({ fromSocketId, answer, streamType }) => {
      try {
        console.log(`[WebRTC] Recebeu answer de ${fromSocketId} (${streamType})`);
        const peerKey = `${fromSocketId}_${streamType}`;
        const peerMap = streamType === 'screen' ? this.screenPeers : this.peers;
        const pc = peerMap.get(fromSocketId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await this.drainPendingCandidates(peerKey, pc);
        }
      } catch (e) {
        console.error('[WebRTC] Erro processando answer:', e);
      }
    });

    socket.on('webrtc:ice_candidate', async ({ fromSocketId, candidate, streamType }) => {
      try {
        const peerKey = `${fromSocketId}_${streamType}`;
        const peerMap = streamType === 'screen' ? this.screenPeers : this.peers;
        const pc = peerMap.get(fromSocketId);

        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (!this.pendingCandidates.has(peerKey)) {
            this.pendingCandidates.set(peerKey, []);
          }
          this.pendingCandidates.get(peerKey)!.push(candidate);
        }
      } catch (e) {
        console.error('[WebRTC] Erro adicionando ICE candidate:', e);
      }
    });
  }
}
