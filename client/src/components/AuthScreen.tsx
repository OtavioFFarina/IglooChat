import React, { useState, useRef } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { Upload, Link, AlertCircle } from 'lucide-react';
import { IglooChatLogo } from './IglooChatLogo';

export const AuthScreen: React.FC = () => {
  const { login, register } = useIglooChat();
  const [isRegistering, setIsRegistering] = useState(false);

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

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
      console.error('Falha no upload do avatar:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (avatarUrlInput.trim()) {
      setAvatar(avatarUrlInput.trim());
      setAvatarUrlInput('');
    }
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering) {
      if (!EMAIL_REGEX.test(email)) {
        setError('Por favor, insira um e-mail válido.');
        return;
      }
      if (!PASSWORD_REGEX.test(password)) {
        setError('A senha deve ter no mínimo 8 caracteres, incluindo letras, números e caracteres especiais.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegistering) {
        if (!username.trim()) {
          setError('Nome de exibição é obrigatório.');
          setLoading(false);
          return;
        }
        const err = await register(email, username, password, avatar);
        if (err) setError(err);
      } else {
        const err = await login(email, password);
        if (err) setError(err);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-discord-darkest flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Discord decorative background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-discord-blurple/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-discord-green/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-[480px] bg-discord-dark border border-discord-floating rounded-2xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* IglooChat Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-discord-darker border border-discord-floating flex items-center justify-center text-white shadow-xl mb-3">
            <IglooChatLogo className="w-10 h-10" size={40} withGradient={true} />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            {isRegistering ? 'Criar sua conta IglooChat' : 'Boas-vindas ao IglooChat'}
          </h2>
          <p className="text-xs text-discord-muted text-center mt-1">
            {isRegistering
              ? 'Comece a conversar por voz, vídeo e tela no IglooChat.'
              : 'Estamos muito animados em ver você novamente!'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-discord-red/10 border border-discord-red/30 rounded-lg p-3 flex items-center space-x-2 text-discord-red text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
              E-mail <span className="text-discord-red">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full bg-discord-darkest text-sm text-white px-3.5 py-2.5 rounded-lg border border-discord-floating focus:border-discord-blurple focus:outline-none transition"
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
                Nome de Exibição <span className="text-discord-red">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Como quer ser chamado?"
                className="w-full bg-discord-darkest text-sm text-white px-3.5 py-2.5 rounded-lg border border-discord-floating focus:border-discord-blurple focus:outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
              Senha <span className="text-discord-red">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-discord-darkest text-sm text-white px-3.5 py-2.5 rounded-lg border border-discord-floating focus:border-discord-blurple focus:outline-none transition"
            />
          </div>

          {/* Registration Profile Photo Options */}
          {isRegistering && (
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-discord-muted uppercase tracking-wider mb-1.5">
                Foto de Perfil (Opcional)
              </label>

              <div className="flex items-center space-x-3 mb-2">
                <img
                  src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || 'IglooChat')}&backgroundColor=5865F2&textColor=ffffff`}
                  alt="Avatar Preview"
                  className="w-12 h-12 rounded-full object-cover border-2 border-discord-blurple shadow-md flex-shrink-0"
                />

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="bg-discord-darker hover:bg-discord-darkhover text-white text-xs px-2.5 py-1.5 rounded flex items-center space-x-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Enviando...' : 'Fazer Upload de Foto'}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <input
                      type="url"
                      placeholder="Ou cole a URL de uma imagem..."
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      className="flex-1 bg-discord-darkest text-xs text-white px-2.5 py-1 rounded border border-discord-floating focus:border-discord-blurple focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="bg-discord-darker hover:bg-discord-darkhover text-discord-header text-xs px-2 py-1 rounded transition"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-discord-blurple hover:bg-discord-blurple-hover text-white font-bold text-sm py-3 rounded-lg shadow-lg transition mt-4 disabled:opacity-50"
          >
            {loading ? 'Processando...' : isRegistering ? 'Cadastrar e Entrar' : 'Entrar'}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-4 text-xs text-discord-muted">
          {isRegistering ? (
            <span>
              Já tem uma conta?{' '}
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                }}
                className="text-discord-link hover:underline font-semibold"
              >
                Entrar
              </button>
            </span>
          ) : (
            <span>
              Precisa de uma conta?{' '}
              <button
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                }}
                className="text-discord-link hover:underline font-semibold"
              >
                Registre-se
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
