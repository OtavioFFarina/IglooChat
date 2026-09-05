import React, { useState, useEffect, useRef } from 'react';
import { useConcord } from '../context/ConcordContext';
import { User, UserStatus } from '../types';
import { X, Mic, Video, Monitor, Check, UserCheck } from 'lucide-react';

export const UserSettingsModal: React.FC = () => {
  const {
    closeUserSettingsModal,
    currentUser,
    updateUserProfile,
    allUsers,
    switchUser
  } = useConcord();

  const [activeTab, setActiveTab] = useState<'profile' | 'voice' | 'switch'>('profile');
  const [username, setUsername] = useState(currentUser.username);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [status, setStatus] = useState<UserStatus>(currentUser.status);
  const [customStatus, setCustomStatus] = useState(currentUser.custom_status || '');
  const [isSaving, setIsSaving] = useState(false);

  // Audio / Mic meter test
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micIntervalRef = useRef<any>(null);

  // Camera preview test
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Screen share test
  const [isTestingScreen, setIsTestingScreen] = useState(false);
  const [screenTestStream, setScreenTestStream] = useState<MediaStream | null>(null);
  const screenPreviewRef = useRef<HTMLVideoElement>(null);

  // Stop / Cleanup functions defined first
  const stopMicTest = () => {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close().catch(() => {});
      micAudioCtxRef.current = null;
    }
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

  // Start functions
  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      micAudioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      setIsTestingMic(true);

      micIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
      }, 50);
    } catch (err) {
      console.warn('Erro no teste de microfone', err);
    }
  };

  const startCameraTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setIsTestingCamera(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera test error', err);
    }
  };

  const startScreenTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenTestStream(stream);
      setIsTestingScreen(true);
      if (screenPreviewRef.current) {
        screenPreviewRef.current.srcObject = stream;
      }
      stream.getVideoTracks()[0].onended = () => {
        stopScreenTest();
      };
    } catch (err) {
      console.warn('Screen test error', err);
    }
  };

  useEffect(() => {
    setUsername(currentUser.username);
    setAvatar(currentUser.avatar);
    setStatus(currentUser.status);
    setCustomStatus(currentUser.custom_status || '');
  }, [currentUser]);

  // Cleanup all hardware tests on unmount
  useEffect(() => {
    return () => {
      stopMicTest();
      stopCameraTest();
      stopScreenTest();
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateUserProfile({
      username,
      avatar,
      status,
      custom_status: customStatus
    });
    setIsSaving(false);
    closeUserSettingsModal();
  };

  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#313338] border border-[#232428] rounded-2xl w-full max-w-2xl h-[560px] flex overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Left Sidebar Tabs */}
        <div className="w-52 bg-[#2b2d31] p-4 flex flex-col justify-between border-r border-[#232428]">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-discord-muted uppercase tracking-wider px-2 py-1">
              Configurações
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${
                activeTab === 'profile' ? 'bg-[#35373c] text-white' : 'text-discord-muted hover:bg-[#35373c]/50 hover:text-white'
              }`}
            >
              Meu Perfil
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${
                activeTab === 'voice' ? 'bg-[#35373c] text-white' : 'text-discord-muted hover:bg-[#35373c]/50 hover:text-white'
              }`}
            >
              Voz, Vídeo & Tela
            </button>

            <button
              onClick={() => setActiveTab('switch')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${
                activeTab === 'switch' ? 'bg-[#35373c] text-white' : 'text-discord-muted hover:bg-[#35373c]/50 hover:text-white'
              }`}
            >
              Alternar Conta (Teste)
            </button>
          </div>

          <div className="text-[10px] text-discord-muted px-2">
            Concord v1.0.0
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto relative">
          <button
            onClick={closeUserSettingsModal}
            className="absolute top-5 right-5 text-discord-muted hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-3">Perfil de Usuário</h2>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-discord-muted uppercase mb-1.5">
                  Foto de Perfil (Avatar)
                </label>
                <div className="flex items-center space-x-3 mb-2">
                  <img src={avatar} alt="Current" className="w-14 h-14 rounded-full object-cover border-2 border-discord-blurple" />
                  <div className="flex space-x-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <img
                        key={idx}
                        src={preset}
                        alt="Preset"
                        onClick={() => setAvatar(preset)}
                        className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition ${
                          avatar === preset ? 'border-discord-blurple scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-discord-muted uppercase mb-1.5">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2 rounded-lg border border-[#2b2d31] focus:border-discord-blurple focus:outline-none"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-discord-muted uppercase mb-1.5">
                  Status de Presença
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'online', label: 'Disponível', color: 'bg-discord-green' },
                    { id: 'idle', label: 'Ausente', color: 'bg-discord-amber' },
                    { id: 'dnd', label: 'Não Perturbar', color: 'bg-discord-red' },
                    { id: 'offline', label: 'Invisível', color: 'bg-discord-gray' }
                  ].map(item => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setStatus(item.id as UserStatus)}
                      className={`flex items-center space-x-2 p-2 rounded-lg border text-xs font-semibold transition ${
                        status === item.id
                          ? 'bg-[#35373c] border-discord-blurple text-white'
                          : 'bg-[#1e1f22] border-[#2b2d31] text-discord-muted hover:text-white'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Status */}
              <div>
                <label className="block text-xs font-bold text-discord-muted uppercase mb-1.5">
                  Status Personalizado
                </label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="Ex: Codando o Concord 🚀"
                  className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2 rounded-lg border border-[#2b2d31] focus:border-discord-blurple focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-md transition"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: VOICE, VIDEO & SCREEN TESTS */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Teste de Dispositivos</h2>

              {/* Mic Test */}
              <div className="bg-[#1e1f22] p-3.5 rounded-xl border border-[#2b2d31] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <Mic className="w-4 h-4 text-discord-green" />
                    <span>Teste de Microfone (VAD)</span>
                  </div>
                  <button
                    type="button"
                    onClick={isTestingMic ? stopMicTest : startMicTest}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      isTestingMic ? 'bg-discord-red text-white' : 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
                    }`}
                  >
                    {isTestingMic ? 'Parar Teste' : 'Testar Microfone'}
                  </button>
                </div>

                {/* Live Volume Meter */}
                <div className="w-full h-3 bg-[#2b2d31] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-discord-green transition-all duration-75"
                    style={{ width: `${micVolume}%` }}
                  />
                </div>
                <div className="text-[10px] text-discord-muted">
                  Fale no microfone para ver a barra verde subir. No Concord, o círculo verde ao redor do seu avatar acende automaticamente quando você fala!
                </div>
              </div>

              {/* Camera Preview Test */}
              <div className="bg-[#1e1f22] p-3.5 rounded-xl border border-[#2b2d31] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <Video className="w-4 h-4 text-discord-blurple" />
                    <span>Teste de Câmera</span>
                  </div>
                  <button
                    type="button"
                    onClick={isTestingCamera ? stopCameraTest : startCameraTest}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      isTestingCamera ? 'bg-discord-red text-white' : 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
                    }`}
                  >
                    {isTestingCamera ? 'Parar Câmera' : 'Ver Prévia da Câmera'}
                  </button>
                </div>

                {isTestingCamera && (
                  <div className="w-full h-32 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video ref={videoPreviewRef} autoPlay playsInline muted className="h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Screen Share Test */}
              <div className="bg-[#1e1f22] p-3.5 rounded-xl border border-[#2b2d31] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <Monitor className="w-4 h-4 text-amber-400" />
                    <span>Teste de Compartilhamento de Tela</span>
                  </div>
                  <button
                    type="button"
                    onClick={isTestingScreen ? stopScreenTest : startScreenTest}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      isTestingScreen ? 'bg-discord-red text-white' : 'bg-discord-blurple text-white hover:bg-discord-blurple-hover'
                    }`}
                  >
                    {isTestingScreen ? 'Parar Tela' : 'Testar Captura de Tela'}
                  </button>
                </div>

                {isTestingScreen && (
                  <div className="w-full h-36 bg-black rounded-lg overflow-hidden flex items-center justify-center border border-discord-green">
                    <video ref={screenPreviewRef} autoPlay playsInline muted className="h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SWITCH USER (MULTI-CLIENT SIMULATION) */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Alternar Usuário para Testes</h2>
              <p className="text-xs text-discord-muted">
                Para testar o chat em tempo real, chamadas de voz e compartilhamento de tela WebRTC na mesma máquina, você pode alternar de perfil ou abrir outra aba anônima.
              </p>

              <div className="space-y-2">
                {allUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        switchUser(u);
                        closeUserSettingsModal();
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isCurrent
                          ? 'bg-[#35373c] border-discord-blurple'
                          : 'bg-[#1e1f22] border-[#2b2d31] hover:bg-[#35373c]/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div className="font-bold text-sm text-white flex items-center space-x-1.5">
                            <span>{u.username}</span>
                            <span className="text-xs text-discord-muted font-normal">#{u.discriminator}</span>
                          </div>
                          <div className="text-xs text-discord-muted">{u.custom_status || u.status}</div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="flex items-center space-x-1 text-discord-green text-xs font-semibold">
                          <Check className="w-4 h-4" />
                          <span>Ativo</span>
                        </div>
                      ) : (
                        <button className="bg-[#2b2d31] hover:bg-discord-blurple hover:text-white text-discord-muted text-xs font-semibold px-3 py-1.5 rounded transition">
                          Alternar para {u.username}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
