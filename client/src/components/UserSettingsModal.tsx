import React, { useState, useEffect, useRef } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { UserStatus } from '../types';
import { 
  X, 
  Mic, 
  Video, 
  Monitor, 
  Upload, 
  LogOut, 
  Volume2, 
  KeyRound, 
  Trash2, 
  ShieldAlert, 
  History,
  Headphones,
  Sliders,
  Sparkles,
  CheckCircle2,
  AudioWaveform,
  ChevronDown,
  Palette
} from 'lucide-react';

export const UserSettingsModal: React.FC = () => {
  const {
    closeUserSettingsModal,
    currentUser,
    updateUserProfile,
    changePassword,
    deleteAccount,
    logout,
    isNoiseSuppressionEnabled,
    toggleNoiseSuppression,
    appearanceSettings,
    updateAppearanceSettings,
    micSensitivity,
    setMicSensitivity,
    getMicLevel
  } = useIglooChat();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'voice' | 'appearance'>('profile');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [status, setStatus] = useState<UserStatus>(currentUser?.status_preference || (currentUser?.status !== 'offline' ? currentUser?.status : 'online') || 'online');
  const [customStatus, setCustomStatus] = useState(currentUser?.custom_status || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const CONFIRMATION_PHRASE = 'EU ESTOU CIENTE QUE MINHA CONTA SERÁ EXCLUÍDA';

  // Audio & Hardware Devices
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoInputId, setSelectedVideoInputId] = useState<string>(
    localStorage.getItem('igloochat_video_input_id') || ''
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedAudioInputId, setSelectedAudioInputId] = useState<string>(
    localStorage.getItem('igloochat_audio_input_id') || ''
  );
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState<string>(
    localStorage.getItem('igloochat_audio_output_id') || ''
  );
  const [inputVolume, setInputVolume] = useState<number>(100);
  const [outputVolume, setOutputVolume] = useState<number>(100);

  // Audio / Mic meter test
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [hearMyself, setHearMyself] = useState(true);
  const [micVolume, setMicVolume] = useState(0);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micIntervalRef = useRef<any>(null);
  const loopbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Camera preview test
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Screen share test
  const [isTestingScreen, setIsTestingScreen] = useState(false);
  const [screenTestStream, setScreenTestStream] = useState<MediaStream | null>(null);
  const screenPreviewRef = useRef<HTMLVideoElement>(null);

  // Enumerate Audio & Video Devices
  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter(d => d.kind === 'audioinput');
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setAudioInputs(inputs);
      setAudioOutputs(outputs);
      setVideoInputDevices(videoInputs);

      // Auto-select preferred devices if not already chosen
      const savedInput = localStorage.getItem('igloochat_audio_input_id');
      if (!savedInput || !inputs.some(i => i.deviceId === savedInput)) {
        const preferred = inputs.find(i => 
          i.label.toLowerCase().includes('fuxi') || 
          i.label.toLowerCase().includes('usb') || 
          i.label.toLowerCase().includes('headset')
        ) || inputs.find(i => i.deviceId !== 'default') || inputs[0];

        if (preferred) {
          setSelectedAudioInputId(preferred.deviceId);
          localStorage.setItem('igloochat_audio_input_id', preferred.deviceId);
        }
      } else {
        setSelectedAudioInputId(savedInput);
      }

      const savedOutput = localStorage.getItem('igloochat_audio_output_id');
      if (!savedOutput || !outputs.some(o => o.deviceId === savedOutput)) {
        const preferred = outputs.find(o => 
          o.label.toLowerCase().includes('fuxi') || 
          o.label.toLowerCase().includes('usb') || 
          o.label.toLowerCase().includes('headset')
        ) || outputs.find(o => o.deviceId !== 'default') || outputs[0];

        if (preferred) {
          setSelectedAudioOutputId(preferred.deviceId);
          localStorage.setItem('igloochat_audio_output_id', preferred.deviceId);
        }
      } else {
        setSelectedAudioOutputId(savedOutput);
      }

      const savedVideo = localStorage.getItem('igloochat_video_input_id');
      if (!savedVideo || !videoInputs.some(v => v.deviceId === savedVideo)) {
        if (videoInputs[0]) {
          setSelectedVideoInputId(videoInputs[0].deviceId);
          localStorage.setItem('igloochat_video_input_id', videoInputs[0].deviceId);
        }
      } else {
        setSelectedVideoInputId(savedVideo);
      }
    } catch (e) {
      console.warn('Erro ao carregar dispositivos de áudio/vídeo:', e);
    }
  };

  useEffect(() => {
    loadDevices();
    if (navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', loadDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
      };
    }
  }, []);

  useEffect(() => {
    if (videoPreviewRef.current && cameraStream) {
      videoPreviewRef.current.srcObject = cameraStream;
      videoPreviewRef.current.play().catch(e => console.warn('Preview play error:', e));
    }
  }, [cameraStream, isTestingCamera]);

  useEffect(() => {
    if (screenPreviewRef.current && screenTestStream) {
      screenPreviewRef.current.srcObject = screenTestStream;
      screenPreviewRef.current.play().catch(e => console.warn('Screen preview play error:', e));
    }
  }, [screenTestStream, isTestingScreen]);

  const [autoSensitivity, setAutoSensitivity] = useState(false);
  const [liveMicLevel, setLiveMicLevel] = useState(0);

  useEffect(() => {
    if (activeTab !== 'voice') return;
    const interval = setInterval(() => {
      const level = getMicLevel();
      setLiveMicLevel(level);
    }, 80);
    return () => clearInterval(interval);
  }, [activeTab, getMicLevel]);

  const stopMicTest = () => {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    if (loopbackAudioRef.current) {
      loopbackAudioRef.current.pause();
      loopbackAudioRef.current.srcObject = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close().catch(() => {});
      micAudioCtxRef.current = null;
    }
    micSourceRef.current = null;
    setIsTestingMic(false);
    setMicVolume(0);
  };

  const stopCameraTest = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsTestingCamera(false);
  };

  const stopScreenTest = () => {
    if (screenTestStream) {
      screenTestStream.getTracks().forEach(t => t.stop());
      setScreenTestStream(null);
    }
    setIsTestingScreen(false);
  };

  // Speaker audio output test (Procedural Chime)
  const testHeadphoneAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      ctx.resume().then(async () => {
        if (selectedAudioOutputId && (ctx as any).setSinkId) {
          await (ctx as any).setSinkId(selectedAudioOutputId).catch(() => {});
        }
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime((0.15 * outputVolume) / 100, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
        });
      });
    } catch (e) {
      console.warn('Erro ao testar saída de som:', e);
    }
  };

  const startMicTest = async () => {
    try {
      // If devices list labels are blank, ask permission to reveal them
      if (audioInputs.length === 0 || audioInputs.every(i => !i.label)) {
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
        await loadDevices();
      }

      const activeInputId = selectedAudioInputId || localStorage.getItem('igloochat_audio_input_id');
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: activeInputId && activeInputId !== 'default' ? { exact: activeInputId } : undefined,
          echoCancellation: false, // Disabling echo cancellation for loopback test ensures no suppression
          noiseSuppression: false,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;

      // 1. Hardware Loopback via HTML5 Audio Element (keeps Chrome audio pipeline active)
      if (loopbackAudioRef.current) {
        loopbackAudioRef.current.srcObject = stream;
        loopbackAudioRef.current.muted = !hearMyself;
        loopbackAudioRef.current.volume = outputVolume / 100;
        if (selectedAudioOutputId && (loopbackAudioRef.current as any).setSinkId) {
          (loopbackAudioRef.current as any).setSinkId(selectedAudioOutputId).catch(() => {});
        }
        loopbackAudioRef.current.play().catch(e => console.warn('Loopback play error:', e));
      }

      // 2. Web Audio Analyser using RMS Time-Domain Data
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      micAudioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      micSourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);
      setIsTestingMic(true);

      micIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sum += norm * norm;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        // Sensitive human perception scale:
        // Ambient noise (~0.003) -> 0%
        // Normal speech (~0.05 - 0.3) -> 30% - 90%
        const adjusted = Math.max(0, rms - 0.002);
        const volume = Math.min(100, Math.round(Math.pow(adjusted * 3.5, 0.65) * 100));
        setMicVolume(volume);
      }, 40);
    } catch (err) {
      console.warn('Erro no teste de microfone:', err);
    }
  };

  const handleToggleHearMyself = (enabled: boolean) => {
    setHearMyself(enabled);
    if (loopbackAudioRef.current) {
      loopbackAudioRef.current.muted = !enabled;
      loopbackAudioRef.current.volume = outputVolume / 100;
      if (enabled) {
        loopbackAudioRef.current.play().catch(() => {});
      }
    }
  };

  const handleInputDeviceChange = (deviceId: string) => {
    setSelectedAudioInputId(deviceId);
    localStorage.setItem('igloochat_audio_input_id', deviceId);
    if (isTestingMic) {
      stopMicTest();
      setTimeout(() => startMicTest(), 150);
    }
  };

  const handleOutputDeviceChange = (deviceId: string) => {
    setSelectedAudioOutputId(deviceId);
    localStorage.setItem('igloochat_audio_output_id', deviceId);
    if (loopbackAudioRef.current && (loopbackAudioRef.current as any).setSinkId) {
      (loopbackAudioRef.current as any).setSinkId(deviceId).catch(() => {});
    }
  };

  const handleOutputVolumeChange = (vol: number) => {
    setOutputVolume(vol);
    if (loopbackAudioRef.current) {
      loopbackAudioRef.current.volume = vol / 100;
    }
  };

  const startCameraTest = async () => {
    try {
      setCameraError(null);
      let stream: MediaStream;
      const constraints: MediaStreamConstraints = {
        video: selectedVideoInputId && selectedVideoInputId !== 'default'
          ? { deviceId: { exact: selectedVideoInputId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false
      };
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoInputId && selectedVideoInputId !== 'default' ? { deviceId: { exact: selectedVideoInputId } } : true,
          audio: false
        });
      }

      setCameraStream(stream);
      setIsTestingCamera(true);
    } catch (err: any) {
      console.warn('Erro no teste de câmera', err);
      setCameraError(err?.message || 'Câmera não encontrada ou acesso negado pelo navegador.');
      setIsTestingCamera(false);
    }
  };

  const startScreenTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      setScreenTestStream(stream);
      setIsTestingScreen(true);
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => stopScreenTest();
      }
    } catch (err) {
      console.warn('Erro no teste de tela', err);
    }
  };

  const handleClose = () => {
    stopMicTest();
    stopCameraTest();
    stopScreenTest();
    closeUserSettingsModal();
  };

  // Avatar upload
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingAvatar(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setAvatar(data.url);
      }
    } catch (err) {
      console.error('Falha no upload de foto', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const applyAvatarUrl = () => {
    if (avatarUrlInput.trim()) {
      setAvatar(avatarUrlInput.trim());
      setAvatarUrlInput('');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        username,
        avatar,
        status,
        custom_status: customStatus
      });
      handleClose();
    } catch (e) {
      console.error('Failed to update profile', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordStatus({ type: 'success', message: 'Senha atualizada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordStatus({ type: 'error', message: res.error || 'Erro ao atualizar senha.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!termsAccepted || deleteConfirmationText !== CONFIRMATION_PHRASE) return;
    setIsDeletingAccount(true);
    const success = await deleteAccount();
    setIsDeletingAccount(false);
    if (!success) {
      alert('Falha ao excluir a conta. Verifique sua conexão e tente novamente.');
    }
  };

  const isDeleteButtonEnabled = termsAccepted && deleteConfirmationText === CONFIRMATION_PHRASE;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Hidden Loopback Audio Element for Real-Time Microphone Feedback */}
      <audio ref={loopbackAudioRef} autoPlay playsInline />

      <div className="bg-discord-dark w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90dvh] md:h-[580px] max-h-[92dvh] border border-discord-floating">
        
        {/* Settings Left Navigation Sidebar */}
        <div className="w-full md:w-56 bg-discord-darker p-4 flex flex-col justify-between border-r border-discord-floating flex-shrink-0">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-discord-muted uppercase tracking-wider px-2 mb-2">
              Configurações
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-2.5 py-2 rounded text-xs font-semibold transition ${
                activeTab === 'profile'
                  ? 'bg-discord-darkhover text-discord-header'
                  : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-discord-header'
              }`}
            >
              Meu Perfil
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-2.5 py-2 rounded text-xs font-semibold transition flex items-center justify-between ${
                activeTab === 'security'
                  ? 'bg-discord-darkhover text-discord-header'
                  : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-discord-header'
              }`}
            >
              <span>Segurança & Senha</span>
              <KeyRound className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full text-left px-2.5 py-2 rounded text-xs font-semibold transition flex items-center justify-between ${
                activeTab === 'voice'
                  ? 'bg-discord-darkhover text-discord-header'
                  : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-discord-header'
              }`}
            >
              <span>Voz, Vídeo & Tela</span>
              <Sliders className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full text-left px-2.5 py-2 rounded text-xs font-semibold transition flex items-center justify-between ${
                activeTab === 'appearance'
                  ? 'bg-discord-darkhover text-discord-header'
                  : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-discord-header'
              }`}
            >
              <span>Aparência & Layout</span>
              <Palette className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              handleClose();
              logout();
            }}
            className="w-full flex items-center space-x-2 text-discord-red hover:bg-discord-red/10 px-2.5 py-2 rounded text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col h-full bg-discord-dark overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-discord-floating flex items-center justify-between flex-shrink-0">
            <span className="text-sm font-bold text-discord-muted uppercase tracking-wider">
              {activeTab === 'profile' && 'Perfil de Usuário'}
              {activeTab === 'security' && 'Segurança & Senha'}
              {activeTab === 'voice' && 'Voz & Vídeo — Dispositivos e Testes'}
              {activeTab === 'appearance' && 'Aparência & Layout'}
            </span>

            <button
              onClick={handleClose}
              className="text-discord-muted hover:text-white p-1 rounded-full hover:bg-discord-darkhover transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* ========================================================= */}
            {/* TAB 1: MEU PERFIL */}
            {/* ========================================================= */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-2">
                    Foto de Perfil (Avatar)
                  </label>

                  <div className="flex items-center space-x-4">
                    <img
                      src={avatar}
                      alt={username}
                      className="w-16 h-16 rounded-full object-cover border-2 border-discord-blurple shadow-lg flex-shrink-0"
                    />

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          ref={avatarFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="bg-discord-blurple hover:bg-discord-blurple-hover disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded transition flex items-center space-x-1.5 shadow"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingAvatar ? 'Enviando...' : 'Carregar Imagem'}</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <input
                          type="url"
                          placeholder="Ou cole uma URL de imagem..."
                          value={avatarUrlInput}
                          onChange={(e) => setAvatarUrlInput(e.target.value)}
                          className="flex-1 bg-discord-darkest text-xs text-discord-header px-2.5 py-1.5 rounded border border-discord-floating focus:border-discord-blurple focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={applyAvatarUrl}
                          className="bg-discord-darker hover:bg-discord-darkhover text-xs font-semibold text-discord-normal hover:text-white px-3 py-1.5 rounded transition border border-discord-floating"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Avatar History (Recent Avatars) */}
                  {currentUser?.avatar_history && currentUser.avatar_history.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-discord-floating">
                      <div className="text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <History className="w-3 h-3" />
                        <span>Histórico de Avatares Recentes:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.avatar_history.map((histUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatar(histUrl)}
                            title="Restaurar esta foto"
                            className={`w-10 h-10 rounded-full overflow-hidden border-2 transition hover:scale-105 ${
                              avatar === histUrl ? 'border-discord-green ring-2 ring-discord-green/30' : 'border-discord-floating hover:border-white'
                            }`}
                          >
                            <img src={histUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-discord-darkest text-discord-header text-sm px-3 py-2 rounded-md border border-discord-floating focus:border-discord-blurple focus:outline-none"
                  />
                </div>

                {/* Presence Status */}
                <div>
                  <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
                    Status de Presença
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'online', label: 'Disponível', color: 'bg-discord-green' },
                      { id: 'idle', label: 'Ausente', color: 'bg-discord-amber' },
                      { id: 'dnd', label: 'Não Perturbar', color: 'bg-discord-red' },
                      { id: 'offline', label: 'Invisível', color: 'bg-discord-gray' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatus(st.id as UserStatus)}
                        className={`flex items-center space-x-2 p-2 rounded-md text-xs font-semibold transition border ${
                          status === st.id
                            ? 'bg-discord-darkhover border-discord-blurple text-discord-header shadow'
                            : 'bg-discord-darkest border-discord-floating text-discord-muted hover:text-discord-header'
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Status Note */}
                <div>
                  <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
                    Status Personalizado
                  </label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="Ex: Codando um projeto novo..."
                    className="w-full bg-discord-darkest text-discord-header text-sm px-3 py-2 rounded-md border border-discord-floating focus:border-discord-blurple focus:outline-none"
                  />
                </div>

                {/* Submit Profile */}
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-discord-blurple hover:bg-discord-blurple-hover disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded transition shadow"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: SEGURANÇA & SENHA + ZONA DE PERIGO */}
            {/* ========================================================= */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-discord-header uppercase tracking-wider">
                    <KeyRound className="w-4 h-4 text-discord-blurple" />
                    <span>Alterar Senha</span>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1">
                        Senha Atual
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-discord-darkest text-discord-header text-sm px-3 py-2 rounded border border-discord-floating focus:border-discord-blurple focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1">
                          Nova Senha
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-discord-darkest text-discord-header text-sm px-3 py-2 rounded border border-discord-floating focus:border-discord-blurple focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1">
                          Confirmar Nova Senha
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-discord-darkest text-discord-header text-sm px-3 py-2 rounded border border-discord-floating focus:border-discord-blurple focus:outline-none"
                        />
                      </div>
                    </div>

                    {passwordStatus && (
                      <div
                        className={`text-xs p-2.5 rounded font-medium ${
                          passwordStatus.type === 'success'
                            ? 'bg-discord-green/10 text-discord-green border border-discord-green/30'
                            : 'bg-discord-red/10 text-discord-red border border-discord-red/30'
                        }`}
                      >
                        {passwordStatus.message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-discord-blurple hover:bg-discord-blurple-hover disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded transition shadow"
                    >
                      {isChangingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                    </button>
                  </form>
                </div>

                {/* Danger Zone: Account Deletion */}
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-discord-red uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Zona de Perigo — Exclusão de Conta</span>
                  </div>
                  <p className="text-xs text-discord-muted">
                    A exclusão da conta removerá permanentemente seu usuário, mensagens, amizades e servidores dos quais você é proprietário. Esta ação não poderá ser desfeita.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-discord-red hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded transition flex items-center space-x-1.5 shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Conta</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: VOZ, VÍDEO & DISPOSITIVOS */}
            {/* ========================================================= */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                
                {/* 1. Hardware Device Selectors (Discord-Fidelity Grid) */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-4">
                  <div className="flex items-center justify-between border-b border-discord-floating pb-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-discord-header uppercase tracking-wider">
                      <Sliders className="w-4 h-4 text-discord-blurple" />
                      <span>Configurações de Voz & Dispositivos</span>
                    </div>

                    <button
                      type="button"
                      onClick={loadDevices}
                      className="text-[11px] text-discord-blurple hover:underline font-semibold"
                    >
                      Recarregar Dispositivos
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Input Device (Microphone) */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider">
                        Dispositivo de Entrada (Microfone)
                      </label>
                      <select
                        value={selectedAudioInputId}
                        onChange={(e) => handleInputDeviceChange(e.target.value)}
                        className="w-full bg-discord-darkest text-discord-header text-xs px-3 py-2 rounded border border-discord-floating focus:border-discord-blurple focus:outline-none"
                      >
                        {audioInputs.length === 0 && (
                          <option value="">Microfone Padrão do Sistema</option>
                        )}
                        {audioInputs.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Microfone ${i + 1}`}
                          </option>
                        ))}
                      </select>

                      {/* Input Volume */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-discord-muted">
                          <span>Volume de Entrada</span>
                          <span className="font-semibold text-discord-header">{inputVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={inputVolume}
                          onChange={(e) => setInputVolume(Number(e.target.value))}
                          className="w-full accent-discord-blurple cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Output Device (Speakers / Headphones) */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider">
                        Dispositivo de Saída (Fones / Caixas)
                      </label>
                      <select
                        value={selectedAudioOutputId}
                        onChange={(e) => handleOutputDeviceChange(e.target.value)}
                        className="w-full bg-discord-darkest text-discord-header text-xs px-3 py-2 rounded border border-discord-floating focus:border-discord-blurple focus:outline-none"
                      >
                        {audioOutputs.length === 0 && (
                          <option value="">Dispositivo de Saída Padrão</option>
                        )}
                        {audioOutputs.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Saída ${i + 1}`}
                          </option>
                        ))}
                      </select>

                      {/* Output Volume */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] text-discord-muted">
                          <span>Volume de Saída</span>
                          <span className="font-semibold text-discord-header">{outputVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={outputVolume}
                          onChange={(e) => handleOutputVolumeChange(Number(e.target.value))}
                          className="w-full accent-discord-blurple cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Microphone Test with Responsive RMS Volume Meter */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-discord-header uppercase tracking-wider">
                        <Mic className="w-4 h-4 text-discord-green" />
                        <span>Teste de Microfone & Retorno</span>
                      </div>
                      <p className="text-[11px] text-discord-muted mt-0.5">
                        Fale no microfone para testar o nível de voz em tempo real.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={isTestingMic ? stopMicTest : startMicTest}
                      className={`px-4 py-2 rounded text-xs font-semibold transition shadow flex items-center space-x-1.5 ${
                        isTestingMic
                          ? 'bg-discord-red text-white hover:bg-red-600'
                          : 'bg-discord-green text-white hover:bg-emerald-600'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{isTestingMic ? 'Parar Teste' : 'Testar Microfone'}</span>
                    </button>
                  </div>

                  {/* Responsive Visual LED Meter */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-discord-muted">Sensibilidade do Microfone</span>
                      <span className={`font-mono font-bold ${micVolume > 15 ? 'text-discord-green' : 'text-discord-muted'}`}>
                        {isTestingMic ? `${micVolume}%` : 'Inativo'}
                      </span>
                    </div>

                    <div className="w-full bg-discord-darkest h-4 rounded-full overflow-hidden p-0.5 border border-discord-floating relative">
                      <div
                        className={`h-full transition-all duration-75 rounded-full ${
                          micVolume > 60
                            ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-amber-400'
                            : 'bg-discord-green'
                        }`}
                        style={{ width: `${isTestingMic ? Math.max(3, micVolume) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Loopback Toggle with AutoPlay Playback */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-discord-floating">
                    <input
                      type="checkbox"
                      id="loopback-toggle"
                      checked={hearMyself}
                      onChange={(e) => handleToggleHearMyself(e.target.checked)}
                      className="rounded border-discord-floating bg-discord-darkest text-discord-blurple focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="loopback-toggle" className="text-xs text-discord-normal cursor-pointer flex items-center space-x-1.5 font-medium">
                      <Headphones className="w-3.5 h-3.5 text-discord-blurple" />
                      <span>Ouvir retorno do microfone nos fones (Loopback em tempo real)</span>
                    </label>
                  </div>
                </div>

                {/* 3. Speaker Output Test (Harmonic Chime) */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-discord-header uppercase tracking-wider">
                        <Volume2 className="w-4 h-4 text-discord-blurple" />
                        <span>Teste de Saída de Áudio (Fones)</span>
                      </div>
                      <p className="text-[11px] text-discord-muted mt-0.5">
                        Testa se seus fones estão recebendo áudio do navegador.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={testHeadphoneAudio}
                      className="bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-semibold px-4 py-2 rounded transition shadow flex items-center space-x-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Tocar Som de Teste 🔔</span>
                    </button>
                  </div>
                </div>

                {/* 4. Noise Suppression Card (Krisp) */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center space-x-2 text-xs font-bold text-discord-header uppercase tracking-wider">
                      <AudioWaveform className="w-4 h-4 text-discord-green" />
                      <span>Supressão de Ruído Inteligente (Krisp)</span>
                    </div>
                    <p className="text-xs text-discord-muted leading-relaxed">
                      Filtra automaticamente ruídos de fundo como ventiladores, barulho de teclado mecânico e eco do ambiente na sua voz.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleNoiseSuppression}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      isNoiseSuppressionEnabled ? 'bg-discord-green' : 'bg-[#4e5058]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isNoiseSuppressionEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Input Sensitivity / Gate de Ruído */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-discord-header uppercase tracking-wider">
                        <AudioWaveform className="w-4 h-4 text-discord-blurple" />
                        <span>Sensibilidade de Entrada (Gate de Voz)</span>
                      </div>
                      <p className="text-[11px] text-discord-muted mt-0.5">
                        Define o limite mínimo de som para abrir o microfone e transmitir sua voz na chamada.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-[11px] text-discord-muted font-medium cursor-pointer flex items-center space-x-1.5">
                        <span>Automático</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !autoSensitivity;
                            setAutoSensitivity(next);
                            if (next) {
                              setMicSensitivity(50);
                            }
                          }}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            autoSensitivity ? 'bg-discord-green' : 'bg-[#4e5058]'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              autoSensitivity ? 'left-4.5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </div>

                  {/* Dual-Zone Real-time Meter with Threshold Needle */}
                  <div className="space-y-1.5 pt-1">
                    <div className="relative w-full bg-discord-darkest h-6 rounded-lg overflow-hidden border border-discord-floating flex items-center">
                      {(() => {
                        const currentLevel = isTestingMic ? micVolume : liveMicLevel;
                        const isSpeakingGate = currentLevel >= micSensitivity;

                        return (
                          <>
                            {/* Input Level Bar */}
                            <div
                              className={`h-full transition-all duration-75 ${
                                isSpeakingGate
                                  ? 'bg-gradient-to-r from-emerald-600 to-discord-green'
                                  : 'bg-amber-500/50'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, currentLevel))}%` }}
                            />

                            {/* Sensitivity Threshold Needle Marker */}
                            <div
                              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white] z-10 pointer-events-none"
                              style={{ left: `calc(${micSensitivity}% - 2px)` }}
                            />

                            {/* Threshold percentage badge */}
                            <div className="absolute right-2 text-[10px] font-mono text-discord-muted z-10 select-none">
                              {currentLevel > 0 ? (
                                <span className={isSpeakingGate ? 'text-discord-green font-bold' : 'text-amber-400'}>
                                  {isSpeakingGate ? 'Voz Ativa' : 'Cortado'} ({currentLevel}%)
                                </span>
                              ) : (
                                <span>Limite: {micSensitivity}%</span>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Range Slider for Manual Sensitivity */}
                    {!autoSensitivity && (
                      <div className="flex items-center space-x-3 pt-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={micSensitivity}
                          onChange={(e) => setMicSensitivity(Number(e.target.value))}
                          className="w-full h-1.5 bg-discord-darkest rounded-lg appearance-none cursor-pointer accent-discord-blurple"
                          title={`Sensibilidade: ${micSensitivity}%`}
                        />
                        <span className="text-xs font-mono text-discord-header w-10 text-right">
                          {micSensitivity}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Camera Test with Device Selection */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-discord-header uppercase tracking-wider">
                        <Video className="w-4 h-4 text-discord-blurple" />
                        <span>Teste de Câmera & Dispositivo de Vídeo</span>
                      </div>
                      <p className="text-[11px] text-discord-muted mt-0.5">
                        Escolha sua webcam e veja a prévia em tempo real.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={isTestingCamera ? stopCameraTest : startCameraTest}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                        isTestingCamera
                          ? 'bg-discord-red text-white hover:bg-red-600'
                          : 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
                      }`}
                    >
                      {isTestingCamera ? 'Desligar Câmera' : 'Ver Prévia da Câmera'}
                    </button>
                  </div>

                  {/* Camera Device Dropdown */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider">
                      Câmera Selecionada
                    </label>
                    <div className="relative">
                      <select
                        value={selectedVideoInputId}
                        onChange={(e) => {
                          setSelectedVideoInputId(e.target.value);
                          localStorage.setItem('igloochat_video_input_id', e.target.value);
                          if (isTestingCamera) {
                            stopCameraTest();
                            setTimeout(() => startCameraTest(), 200);
                          }
                        }}
                        className="w-full bg-discord-darkest text-discord-header text-xs px-3 py-2.5 rounded-lg border border-discord-floating focus:border-discord-blurple focus:outline-none appearance-none cursor-pointer pr-8"
                      >
                        {videoInputDevices.length === 0 ? (
                          <option value="">Nenhuma câmera detectada pelo navegador</option>
                        ) : (
                          videoInputDevices.map((d, i) => (
                            <option key={d.deviceId || i} value={d.deviceId}>
                              {d.label || `Câmera ${i + 1}`}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-discord-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Camera Error feedback if any */}
                  {cameraError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-discord-red font-medium">
                      ⚠️ {cameraError}
                    </div>
                  )}

                  {/* Camera Preview */}
                  {isTestingCamera && cameraStream && (
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-discord-floating flex items-center justify-center">
                      <video
                        ref={(el) => {
                          if (el && cameraStream && el.srcObject !== cameraStream) {
                            el.srcObject = cameraStream;
                            el.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* 7. Screen Share Test */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-discord-header uppercase tracking-wider">
                      <Monitor className="w-4 h-4 text-discord-amber" />
                      <span>Teste de Compartilhamento de Tela</span>
                    </div>

                    <button
                      type="button"
                      onClick={isTestingScreen ? stopScreenTest : startScreenTest}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                        isTestingScreen
                          ? 'bg-discord-red text-white hover:bg-red-600'
                          : 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
                      }`}
                    >
                      {isTestingScreen ? 'Parar Captura' : 'Testar Captura de Tela'}
                    </button>
                  </div>

                  {isTestingScreen && (
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-discord-floating flex items-center justify-center">
                      <video
                        ref={screenPreviewRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Font Size */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-3">
                  <div className="text-xs font-bold text-discord-header uppercase tracking-wider">
                    Tamanho da Fonte das Mensagens
                  </div>
                  <p className="text-xs text-discord-muted">
                    Ajuste o tamanho do texto do chat para melhor legibilidade no seu monitor ou celular.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { id: 'small', label: 'Pequena (12px)' },
                      { id: 'normal', label: 'Normal (14px)' },
                      { id: 'medium', label: 'Média (16px)' },
                      { id: 'large', label: 'Grande (18px)' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateAppearanceSettings({ fontSize: item.id as any })}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                          appearanceSettings?.fontSize === item.id
                            ? 'bg-discord-blurple border-discord-blurple text-white shadow'
                            : 'bg-discord-darkest border-discord-floating text-discord-muted hover:text-white hover:border-discord-muted/50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Display Mode */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-3">
                  <div className="text-xs font-bold text-discord-header uppercase tracking-wider">
                    Modo de Exibição das Mensagens
                  </div>
                  <p className="text-xs text-discord-muted">
                    Escolha entre o visual espaçoso padrão do Discord ou o modo compacto ultra-denso.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => updateAppearanceSettings({ messageDisplay: 'cozy' })}
                      className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                        appearanceSettings?.messageDisplay !== 'compact'
                          ? 'bg-discord-darkhover border-discord-blurple text-discord-header shadow'
                          : 'bg-discord-darkest border-discord-floating text-discord-muted hover:border-discord-muted/50'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 border-discord-blurple flex-shrink-0">
                        {appearanceSettings?.messageDisplay !== 'compact' && (
                          <div className="w-2 h-2 rounded-full bg-discord-blurple" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-discord-header">Confortável (Padrão)</div>
                        <div className="text-[11px] text-discord-muted mt-0.5">
                          Visual moderno com avatares grandes e espaçamento relaxado.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateAppearanceSettings({ messageDisplay: 'compact' })}
                      className={`p-3 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                        appearanceSettings?.messageDisplay === 'compact'
                          ? 'bg-discord-darkhover border-discord-blurple text-discord-header shadow'
                          : 'bg-discord-darkest border-discord-floating text-discord-muted hover:border-discord-muted/50'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 border-discord-blurple flex-shrink-0">
                        {appearanceSettings?.messageDisplay === 'compact' && (
                          <div className="w-2 h-2 rounded-full bg-discord-blurple" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-discord-header">Compacto (IRC Style)</div>
                        <div className="text-[11px] text-discord-muted mt-0.5">
                          Mais mensagens por tela, com horário na esquerda e sem avatares repetidos.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Theme Mode */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-3">
                  <div className="text-xs font-bold text-discord-header uppercase tracking-wider">
                    Tema do IglooChat
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {[
                      { id: 'dark', title: 'Escuro Padrão', desc: 'Visual clássico Discord #313338', color: '#313338' },
                      { id: 'midnight', title: 'Meia-noite (AMOLED)', desc: 'Preto puro #000000 ultra contraste', color: '#000000' },
                      { id: 'igloochat', title: 'IglooChat Cyber', desc: 'Azul e ciano espacial profundo', color: '#06080d' },
                      { id: 'blurple', title: 'Roxo Neon', desc: 'Violeta cósmico com toque neon', color: '#0d0a1a' },
                      { id: 'emerald', title: 'Floresta Esmeralda', desc: 'Verde musgo nórdico elegante', color: '#040d08' },
                      { id: 'crimson', title: 'Rubro Carmesim', desc: 'Bordeaux e escarlate imersivo', color: '#0e0507' }
                    ].map(t => {
                      const isCurrent = appearanceSettings?.theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updateAppearanceSettings({ theme: t.id as any })}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                            isCurrent
                              ? 'bg-discord-darkhover border-discord-blurple shadow-lg ring-2 ring-discord-blurple'
                              : 'bg-discord-darkest border-discord-floating hover:border-discord-muted/50 hover:bg-discord-darkhover/50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                              style={{ backgroundColor: t.color }}
                            />
                            <span className="text-xs font-bold text-discord-header">{t.title}</span>
                            {isCurrent && (
                              <span className="ml-auto text-[10px] font-bold text-discord-blurple uppercase tracking-wider">Ativo</span>
                            )}
                          </div>
                          <span className="text-[10px] text-discord-muted leading-tight">{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-discord-darker p-4 rounded-xl border border-discord-floating space-y-2">
                  <div className="text-[11px] font-bold text-discord-muted uppercase tracking-wider">
                    Pré-visualização em Tempo Real
                  </div>
                  <div className="p-3 bg-discord-dark rounded-lg border border-discord-floating flex items-start space-x-3">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={currentUser?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-discord-header font-bold text-sm">{currentUser?.username}</span>
                        <span className="text-[11px] text-discord-muted">Hoje às 20:45</span>
                      </div>
                      <p className={`text-discord-normal mt-0.5 ${
                        appearanceSettings?.fontSize === 'small' ? 'text-xs' :
                        appearanceSettings?.fontSize === 'medium' ? 'text-base' :
                        appearanceSettings?.fontSize === 'large' ? 'text-lg' : 'text-sm'
                      }`}>
                        Este é um exemplo de como suas mensagens vão aparecer com as configurações selecionadas!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-discord-dark w-full max-w-md rounded-2xl p-6 border border-red-500/30 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-discord-red font-bold text-base">
              <ShieldAlert className="w-5 h-5" />
              <span>Excluir Conta Permanentemente</span>
            </div>

            <p className="text-xs text-discord-muted leading-relaxed">
              Esta ação é <span className="text-discord-header font-bold">irreversível</span>. Todos os seus dados, amigos, mensagens e servidores serão apagados para sempre.
            </p>

            <div className="bg-discord-darkest p-3 rounded-lg border border-discord-floating flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="accept-terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-discord-floating bg-discord-darker text-discord-red focus:ring-0 cursor-pointer"
              />
              <label htmlFor="accept-terms" className="text-xs text-discord-normal cursor-pointer leading-tight">
                Estou ciente e aceito os termos de exclusão permanente da minha conta.
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider">
                Para confirmar, digite exatamente a frase abaixo:
              </label>
              <div className="p-2.5 bg-discord-darkest rounded border border-amber-500/30 text-amber-400 font-mono text-xs font-semibold text-center select-all">
                {CONFIRMATION_PHRASE}
              </div>
              <input
                type="text"
                placeholder="Digite a frase de confirmação..."
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full bg-discord-darkest text-discord-header text-xs px-3 py-2 rounded border border-discord-floating focus:border-discord-red focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTermsAccepted(false);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 text-xs font-semibold text-discord-muted hover:text-white transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!isDeleteButtonEnabled || isDeletingAccount}
                className={`px-4 py-2 text-xs font-semibold rounded transition shadow flex items-center space-x-1.5 ${
                  isDeleteButtonEnabled && !isDeletingAccount
                    ? 'bg-discord-red hover:bg-red-700 text-white cursor-pointer'
                    : 'bg-red-900/40 text-white/40 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingAccount ? 'Excluindo...' : 'Confirmar Exclusão de Conta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
