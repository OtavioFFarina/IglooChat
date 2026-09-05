import { socket } from './socket';

export interface WebRTCCallbacks {
  onRemoteStream: (socketId: string, stream: MediaStream, streamType: 'camera' | 'screen') => void;
  onRemoteStreamRemoved: (socketId: string, streamType: 'camera' | 'screen') => void;
  onSpeakingChanged: (isSpeaking: boolean) => void;
  onScreenShareEnded: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCManager {
  private localAudioStream: MediaStream | null = null;
  private localVideoStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;

  // peerId -> RTCPeerConnection (one for user media, one for screen media if separated)
  private peers: Map<string, RTCPeerConnection> = new Map();
  private screenPeers: Map<string, RTCPeerConnection> = new Map();

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: any = null;
  private isSpeaking = false;
  private callbacks: WebRTCCallbacks;

  constructor(callbacks: WebRTCCallbacks) {
    this.callbacks = callbacks;
    this.setupSignalingListeners();
  }

  // =====================================
  // LOCAL MEDIA CAPTURE
  // =====================================

  async startMicrophone(): Promise<MediaStream | null> {
    try {
      if (this.localAudioStream) return this.localAudioStream;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      this.localAudioStream = stream;
      this.setupVAD(stream);
      this.addTracksToPeers(stream, this.peers);
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Permissão de microfone negada ou indisponível:', err);
      return null;
    }
  }

  stopMicrophone() {
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach(t => t.stop());
      this.localAudioStream = null;
    }
    this.stopVAD();
  }

  setMicrophoneMuted(muted: boolean) {
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  async startCamera(): Promise<MediaStream | null> {
    try {
      if (this.localVideoStream) return this.localVideoStream;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false
      });
      this.localVideoStream = stream;
      this.addTracksToPeers(stream, this.peers);
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Câmera negada ou indisponível:', err);
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
  // SCREEN SHARING (COMPARTILHAMENTO DE TELA)
  // =====================================

  async startScreenShare(): Promise<MediaStream | null> {
    try {
      if (this.localScreenStream) return this.localScreenStream;

      // Capture screen with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true
      });

      this.localScreenStream = stream;

      // Handle user clicking native "Parar compartilhamento" bar
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopScreenShare();
          this.callbacks.onScreenShareEnded();
        };
      }

      // Add to screen peer connections and notify peers
      this.addTracksToPeers(stream, this.screenPeers);
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
  // VOICE ACTIVITY DETECTION (VAD)
  // =====================================

  private setupVAD(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let speakingCounter = 0;

      this.vadInterval = setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for speaking
        const isSpeakingNow = average > 18;

        if (isSpeakingNow) {
          speakingCounter = 4; // keep active for at least ~200ms
        } else if (speakingCounter > 0) {
          speakingCounter--;
        }

        const activeSpeaking = speakingCounter > 0;
        if (this.isSpeaking !== activeSpeaking) {
          this.isSpeaking = activeSpeaking;
          this.callbacks.onSpeakingChanged(activeSpeaking);
        }
      }, 60);
    } catch (e) {
      console.warn('[VAD] Falha ao inicializar Voice Activity Detection:', e);
    }
  }

  private stopVAD() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.isSpeaking = false;
    this.callbacks.onSpeakingChanged(false);
  }

  // =====================================
  // PEER CONNECTION MANAGEMENT
  // =====================================

  createPeerConnection(targetSocketId: string, streamType: 'camera' | 'screen'): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:ice_candidate', {
          toSocketId: targetSocketId,
          candidate: event.candidate,
          streamType
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Recebeu track remoto de ${targetSocketId} (${streamType}):`, event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.callbacks.onRemoteStream(targetSocketId, stream, streamType);

      event.track.onended = () => {
        this.callbacks.onRemoteStreamRemoved(targetSocketId, streamType);
      };
    };

    // Add existing tracks
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
    // 1. Camera / Audio connection
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

    // 2. If screen sharing is already active, create screen offer
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

  async renegotiateScreenWithAllPeers() {
    if (!this.localScreenStream) return;
    for (const [targetSocketId] of this.peers.entries()) {
      let screenPC = this.screenPeers.get(targetSocketId);
      if (!screenPC) {
        screenPC = this.createPeerConnection(targetSocketId, 'screen');
      }
      try {
        const offer = await screenPC.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await screenPC.setLocalDescription(offer);
        socket.emit('webrtc:offer', {
          toSocketId: targetSocketId,
          offer,
          streamType: 'screen'
        });
      } catch (e) {
        console.error('[WebRTC] Erro ao renegociar tela:', e);
      }
    }
  }

  private addTracksToPeers(stream: MediaStream, peerMap: Map<string, RTCPeerConnection>) {
    for (const pc of peerMap.values()) {
      stream.getTracks().forEach(track => {
        const senders = pc.getSenders();
        const alreadyAdded = senders.some(s => s.track && s.track.id === track.id);
        if (!alreadyAdded) {
          pc.addTrack(track, stream);
        }
      });
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
      this.callbacks.onRemoteStreamRemoved(socketId, 'camera');
    }
    if (this.screenPeers.has(socketId)) {
      this.screenPeers.get(socketId)?.close();
      this.screenPeers.delete(socketId);
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
  }

  // =====================================
  // SIGNALING DISPATCHER
  // =====================================

  private setupSignalingListeners() {
    socket.on('webrtc:offer', async ({ fromSocketId, offer, streamType }) => {
      try {
        console.log(`[WebRTC] Recebeu offer de ${fromSocketId} (${streamType})`);
        const peerMap = streamType === 'screen' ? this.screenPeers : this.peers;
        let pc = peerMap.get(fromSocketId);
        if (!pc) {
          pc = this.createPeerConnection(fromSocketId, streamType);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
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
        const peerMap = streamType === 'screen' ? this.screenPeers : this.peers;
        const pc = peerMap.get(fromSocketId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (e) {
        console.error('[WebRTC] Erro processando answer:', e);
      }
    });

    socket.on('webrtc:ice_candidate', async ({ fromSocketId, candidate, streamType }) => {
      try {
        const peerMap = streamType === 'screen' ? this.screenPeers : this.peers;
        const pc = peerMap.get(fromSocketId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error('[WebRTC] Erro adicionando ICE candidate:', e);
      }
    });
  }
}
