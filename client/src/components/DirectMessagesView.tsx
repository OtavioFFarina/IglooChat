import React, { useState } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { User } from '../types';
import { 
  MessageSquare, 
  Phone, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  Search, 
  UserX, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Download,
  Menu
} from 'lucide-react';

export const DirectMessagesView: React.FC = () => {
  const {
    currentUser,
    friends,
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    openDMWithUser,
    startDirectCall,
    openDownloadModal,
    toggleMobileNav
  } = useIglooChat();

  if (!currentUser) return null;

  const [tab, setTab] = useState<'online' | 'all' | 'pending' | 'add'>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [friendTagInput, setFriendTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const onlineFriends = friends.filter(u => u.status !== 'offline');
  const pendingIncoming = friendRequests?.incoming || [];
  const pendingOutgoing = friendRequests?.outgoing || [];
  const totalPending = pendingIncoming.length + pendingOutgoing.length;

  const getFilteredFriends = (list: User[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.discriminator.includes(q)
    );
  };

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendTagInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await sendFriendRequest(friendTagInput.trim());
    setIsSubmitting(false);

    if (res.success) {
      if (res.autoAccepted) {
        setFeedback({
          type: 'success',
          message: 'Solicitação mútua detectada! Vocês agora são amigos no IglooChat!'
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Pedido de amizade enviado para ${friendTagInput.trim()}!`
        });
      }
      setFriendTagInput('');
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Não foi possível enviar o pedido de amizade.'
      });
    }
  };

  const handleStartDM = async (targetUser: User) => {
    await openDMWithUser(targetUser.id);
  };

  const handleStartCall = async (targetUser: User) => {
    await openDMWithUser(targetUser.id);
    startDirectCall(targetUser);
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online': return 'bg-discord-green';
      case 'idle': return 'bg-discord-amber';
      case 'dnd': return 'bg-discord-red';
      default: return 'bg-discord-gray';
    }
  };

  const getStatusText = (user: User) => {
    if (user.custom_status) return user.custom_status;
    switch (user.status) {
      case 'online': return 'Disponível';
      case 'idle': return 'Ausente';
      case 'dnd': return 'Não perturbe';
      default: return 'Indisponível';
    }
  };

  const activeFriendList = tab === 'online' ? getFilteredFriends(onlineFriends) : getFilteredFriends(friends);

  return (
    <div className="flex-1 h-full bg-discord-dark flex flex-col select-none">
      {/* Top Header Bar with Tabs */}
      <div className="h-12 px-3 sm:px-4 bg-discord-dark border-b border-discord-darkest flex items-center justify-between flex-shrink-0 shadow-sm overflow-hidden">
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none py-1 min-w-0 flex-1 mr-2">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={toggleMobileNav}
            title="Abrir Menu de Servidores e Canais"
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-discord-darkhover text-discord-header transition flex-shrink-0 active:scale-95 flex items-center justify-center"
            aria-label="Abrir Menu de Servidores"
          >
            <Menu className="w-5 h-5 text-discord-header" />
          </button>

          <div className="flex items-center space-x-2 pr-3 sm:pr-4 border-r border-discord-floating text-discord-header font-bold text-sm flex-shrink-0">
            <Users className="w-5 h-5 text-discord-muted" />
            <span className="hidden sm:inline">Amigos</span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm flex-nowrap flex-shrink-0">
            <button
              onClick={() => { setTab('online'); setFeedback(null); }}
              className={`px-2.5 sm:px-3 py-1 rounded font-medium transition whitespace-nowrap ${
                tab === 'online' ? 'bg-discord-darkhover text-white' : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-white'
              }`}
            >
              Disponível ({onlineFriends.length})
            </button>

            <button
              onClick={() => { setTab('all'); setFeedback(null); }}
              className={`px-2.5 sm:px-3 py-1 rounded font-medium transition whitespace-nowrap ${
                tab === 'all' ? 'bg-discord-darkhover text-white' : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-white'
              }`}
            >
              Todos ({friends.length})
            </button>

            <button
              onClick={() => { setTab('pending'); setFeedback(null); }}
              className={`px-2.5 sm:px-3 py-1 rounded font-medium transition flex items-center space-x-1 whitespace-nowrap ${
                tab === 'pending' ? 'bg-discord-darkhover text-white' : 'text-discord-muted hover:bg-discord-darkhover/50 hover:text-white'
              }`}
            >
              <span>Pendentes</span>
              {pendingIncoming.length > 0 && (
                <span className="bg-discord-red text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {pendingIncoming.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setTab('add'); setFeedback(null); }}
              className={`px-2.5 sm:px-3 py-1 rounded font-semibold transition flex items-center space-x-1 whitespace-nowrap ${
                tab === 'add' ? 'bg-discord-green text-white shadow' : 'text-discord-green hover:bg-discord-green/10'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Adicionar Amigo</span>
            </button>
          </div>
        </div>

        {/* Right: Download App Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={openDownloadModal}
            title="Baixar Aplicativo para PC ou Celular"
            className="p-1.5 rounded hover:bg-discord-darkhover hover:text-white text-discord-muted transition flex items-center space-x-1.5 text-xs"
          >
            <Download className="w-4 h-4 text-discord-blurple" />
            <span className="font-semibold text-discord-normal hover:text-white">Baixar App</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ========================================================= */}
        {/* TAB 1 & 2: ONLINE / ALL FRIENDS */}
        {/* ========================================================= */}
        {(tab === 'online' || tab === 'all') && (
          <div className="max-w-4xl space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar amigos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-discord-darkest text-white placeholder-discord-muted px-3 py-2 pl-9 rounded-md text-sm border border-discord-floating focus:border-discord-blurple focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-discord-muted absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-discord-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-discord-muted uppercase tracking-wider">
              {tab === 'online' ? `Disponível — ${activeFriendList.length}` : `Todos os Amigos — ${activeFriendList.length}`}
            </div>

            {activeFriendList.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 select-none">
                <div className="w-16 h-16 rounded-full bg-discord-darker border border-discord-floating flex items-center justify-center text-discord-muted">
                  <Users className="w-8 h-8" />
                </div>
                <div className="text-white font-semibold text-base">
                  {friends.length === 0 
                    ? 'Nenhum amigo no IglooChat ainda!' 
                    : 'Nenhum amigo encontrado nesta busca.'}
                </div>
                <p className="text-xs text-discord-muted max-w-sm">
                  {friends.length === 0 
                    ? 'Clique na aba "Adicionar Amigo" e digite o Nome#0000 de um colega para começar a conversar e compartilhar tela.' 
                    : 'Verifique se digitou o nome corretamente.'}
                </p>
                {friends.length === 0 && (
                  <button
                    onClick={() => setTab('add')}
                    className="bg-discord-blurple hover:bg-discord-blurple-hover text-white px-4 py-2 rounded text-xs font-semibold transition"
                  >
                    Adicionar Novo Amigo
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {activeFriendList.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-discord-darkhover/50 border-t border-discord-floating/30 group transition"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="relative flex-shrink-0">
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className={`w-10 h-10 rounded-full object-cover ${friend.status === 'offline' ? 'grayscale opacity-75' : ''}`}
                        />
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-discord-dark ${getStatusDot(friend.status)}`}
                        />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-sm text-discord-header flex items-center space-x-1">
                          <span>{friend.username}</span>
                          <span className="text-xs text-discord-muted opacity-0 group-hover:opacity-100 transition">
                            #{friend.discriminator}
                          </span>
                        </div>
                        <div className="text-xs text-discord-muted truncate">
                          {getStatusText(friend)}
                        </div>
                      </div>
                    </div>

                    {/* Friend Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartDM(friend)}
                        title="Abrir Mensagem Direta"
                        className="p-2 rounded-full bg-discord-darker hover:bg-discord-darkhover border border-discord-floating/30 text-discord-normal hover:text-white transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleStartCall(friend)}
                        title="Iniciar Chamada com Compartilhamento de Tela"
                        className="p-2 rounded-full bg-discord-darker hover:bg-discord-darkhover border border-discord-floating/30 text-discord-green hover:text-white transition"
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      {confirmRemoveId === friend.id ? (
                        <div className="flex items-center space-x-1 bg-discord-darkest p-1 rounded-lg border border-red-500/30 animate-in fade-in">
                          <button
                            onClick={async () => {
                              await removeFriend(friend.id);
                              setConfirmRemoveId(null);
                            }}
                            className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-semibold transition"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            className="text-[11px] text-discord-muted hover:text-white px-1.5 py-1 transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemoveId(friend.id)}
                          title="Remover Amigo"
                          className="p-2 rounded-full bg-discord-darker hover:bg-red-500/20 border border-discord-floating/30 text-discord-muted hover:text-red-400 transition"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PENDENTES (INCOMING & OUTGOING REQUESTS) */}
        {/* ========================================================= */}
        {tab === 'pending' && (
          <div className="max-w-4xl space-y-6">
            {totalPending === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 select-none">
                <div className="w-16 h-16 rounded-full bg-discord-darker border border-discord-floating flex items-center justify-center text-discord-muted">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="text-white font-semibold text-base">Nenhuma solicitação pendente</div>
                <p className="text-xs text-discord-muted max-w-sm">
                  Quando alguém enviar um pedido de amizade ou você enviar uma solicitação, elas aparecerão listadas aqui.
                </p>
              </div>
            ) : (
              <>
                {/* Incoming Requests */}
                {pendingIncoming.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-discord-muted uppercase tracking-wider">
                      Solicitações Recebidas — {pendingIncoming.length}
                    </div>
                    <div className="space-y-1">
                      {pendingIncoming.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-discord-darker hover:bg-discord-darkhover/50 border border-discord-floating transition"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={req.user.avatar}
                              alt={req.user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-semibold text-sm text-discord-header flex items-center space-x-1">
                                <span>{req.user.username}</span>
                                <span className="text-xs text-discord-muted">#{req.user.discriminator}</span>
                              </div>
                              <div className="text-xs text-discord-green font-medium">
                                Pedido de amizade recebido
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => acceptFriendRequest(req.id)}
                              title="Aceitar Pedido"
                              className="w-9 h-9 rounded-full bg-discord-darkest hover:bg-discord-green text-discord-muted hover:text-white flex items-center justify-center transition shadow"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => rejectFriendRequest(req.id)}
                              title="Recusar Pedido"
                              className="w-9 h-9 rounded-full bg-discord-darkest hover:bg-discord-red text-discord-muted hover:text-white flex items-center justify-center transition shadow"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outgoing Requests */}
                {pendingOutgoing.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-discord-muted uppercase tracking-wider">
                      Solicitações Enviadas — {pendingOutgoing.length}
                    </div>
                    <div className="space-y-1">
                      {pendingOutgoing.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-discord-darker hover:bg-discord-darkhover/40 border border-discord-floating transition"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={req.user.avatar}
                              alt={req.user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-semibold text-sm text-discord-header flex items-center space-x-1">
                                <span>{req.user.username}</span>
                                <span className="text-xs text-discord-muted">#{req.user.discriminator}</span>
                              </div>
                              <div className="text-xs text-discord-muted">
                                Solicitação de amizade enviada
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => rejectFriendRequest(req.id)}
                            title="Cancelar Solicitação"
                            className="w-9 h-9 rounded-full bg-discord-darkest hover:bg-discord-red text-discord-muted hover:text-white flex items-center justify-center transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ADICIONAR AMIGO */}
        {/* ========================================================= */}
        {tab === 'add' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                Adicionar Amigo
              </h2>
              <p className="text-xs text-discord-muted mt-1">
                Você pode adicionar um amigo usando o nome de usuário com a tag dele (ex: <span className="text-discord-header font-mono font-semibold">Exemplo#0001</span>) ou somente o nome de usuário.
              </p>
            </div>

            <form onSubmit={handleSendFriendRequest} className="space-y-3">
              <div className="bg-discord-darkest p-3 rounded-lg flex items-center border border-discord-floating focus-within:border-discord-blurple transition shadow-inner">
                <input
                  type="text"
                  placeholder="Insira um Nome de Usuário#0000"
                  value={friendTagInput}
                  onChange={(e) => setFriendTagInput(e.target.value)}
                  className="bg-transparent flex-1 text-sm text-white focus:outline-none placeholder-discord-muted"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!friendTagInput.trim() || isSubmitting}
                  className="bg-discord-blurple hover:bg-discord-blurple-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-xs font-semibold transition flex items-center space-x-1.5 flex-shrink-0"
                >
                  {isSubmitting ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Enviar Pedido de Amizade</span>
                    </>
                  )}
                </button>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-lg flex items-center space-x-2 text-xs font-medium animate-in fade-in ${
                    feedback.type === 'success'
                      ? 'bg-discord-green/10 text-discord-green border border-discord-green/30'
                      : 'bg-discord-red/10 text-discord-red border border-discord-red/30'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}
            </form>

            {/* User tag banner */}
            <div className="p-4 rounded-xl bg-discord-darker border border-discord-floating flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-discord-blurple/20 flex items-center justify-center text-discord-blurple">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-discord-muted">Sua tag para amigos te adicionarem:</div>
                  <div className="text-sm font-bold text-white font-mono flex items-center space-x-1">
                    <span>{currentUser.username}</span>
                    <span className="text-discord-muted">#{currentUser.discriminator}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${currentUser.username}#${currentUser.discriminator}`);
                  setFeedback({
                    type: 'success',
                    message: `Tag "${currentUser.username}#${currentUser.discriminator}" copiada para a área de transferência!`
                  });
                }}
                className="bg-discord-darkest hover:bg-discord-darkhover text-xs font-semibold text-discord-normal hover:text-white px-3 py-1.5 rounded transition border border-discord-floating"
              >
                Copiar Minha Tag
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
