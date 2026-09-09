import React, { useState, useEffect } from 'react';
import { useIglooChat } from '../context/IglooChatContext';
import { Server } from '../types';
import { Plus, Compass, Settings, UserPlus, Trash2, LogOut, Download } from 'lucide-react';
import { IglooChatLogo } from './IglooChatLogo';

export const ServerRail: React.FC = () => {
  const {
    currentUser,
    servers,
    currentServer,
    selectServer,
    openCreateServerModal,
    openJoinServerModal,
    openCreateChannelModal,
    openServerSettings,
    leaveServer,
    openDownloadModal
  } = useIglooChat();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; server: Server } | null>(null);

  const isHomeActive = currentServer === null;

  const handleContextMenu = (e: React.MouseEvent, server: Server) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, server });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <nav 
      aria-label="Servidores" 
      className="w-[72px] h-full bg-discord-darkest flex flex-col items-center py-3 flex-shrink-0 z-30 select-none border-r border-discord-darkest"
    >
      {/* IglooChat / Direct Messages Home Button */}
      <div className="relative group w-full flex justify-center mb-2">
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
            isHomeActive ? 'h-10' : hoveredId === 'home' ? 'h-5' : 'h-0'
          }`}
        />

        <button
          onClick={() => selectServer(null)}
          onMouseEnter={() => setHoveredId('home')}
          onMouseLeave={() => setHoveredId(null)}
          className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 shadow-md ${
            isHomeActive
              ? 'bg-discord-blurple rounded-[16px] text-white'
              : 'bg-discord-dark text-discord-normal hover:bg-discord-blurple hover:text-white rounded-[24px] hover:rounded-[16px]'
          }`}
        >
          <IglooChatLogo className="w-7 h-7 transition-transform group-hover:scale-110" withGradient={!isHomeActive} />
        </button>

        <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-discord-floating text-discord-header text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-discord-darkest">
            Mensagens Diretas & Amigos
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="w-8 h-[2px] bg-discord-darkhover rounded mb-2" />

      {/* Servers Scrollable Area */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden space-y-2 flex flex-col items-center scrollbar-none py-1">
        {servers.map((server) => {
          const isActive = currentServer?.id === server.id;
          const initials = server.name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <div key={server.id} className="relative group w-full flex justify-center">
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive ? 'h-10' : hoveredId === server.id ? 'h-5' : 'h-0'
                }`}
              />

              <button
                onClick={() => selectServer(server)}
                onContextMenu={(e) => handleContextMenu(e, server)}
                onMouseEnter={() => setHoveredId(server.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative w-12 h-12 flex items-center justify-center font-bold text-sm tracking-wide transition-all duration-200 overflow-hidden shadow-md ${
                  isActive
                    ? 'bg-discord-blurple text-white rounded-[16px]'
                    : 'bg-discord-dark text-discord-normal hover:bg-discord-blurple hover:text-white rounded-[24px] hover:rounded-[16px]'
                }`}
              >
                {server.icon ? (
                  <img
                    src={server.icon}
                    alt={server.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </button>

              <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <div className="bg-discord-floating text-discord-header text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-discord-darkest">
                  {server.name}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group w-full flex justify-center">
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
              hoveredId === 'add' ? 'h-5' : 'h-0'
            }`}
          />
          <button
            onClick={openCreateServerModal}
            onMouseEnter={() => setHoveredId('add')}
            onMouseLeave={() => setHoveredId(null)}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-discord-dark hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center transition-all duration-200 shadow-md"
          >
            <Plus className="w-6 h-6" />
          </button>
          <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-discord-floating text-discord-header text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-discord-darkest">
              Adicionar um Servidor
            </div>
          </div>
        </div>

        {/* Join Server Button */}
        <div className="relative group w-full flex justify-center">
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
              hoveredId === 'join' ? 'h-5' : 'h-0'
            }`}
          />
          <button
            onClick={openJoinServerModal}
            onMouseEnter={() => setHoveredId('join')}
            onMouseLeave={() => setHoveredId(null)}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-discord-dark hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center transition-all duration-200 shadow-md"
          >
            <Compass className="w-6 h-6" />
          </button>
          <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-discord-floating text-discord-header text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-discord-darkest">
              Entrar por Código de Convite
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-8 h-[2px] bg-discord-darkhover rounded my-1" />

        {/* Download App Button */}
        <div className="relative group w-full flex justify-center">
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
              hoveredId === 'download' ? 'h-5' : 'h-0'
            }`}
          />
          <button
            onClick={openDownloadModal}
            onMouseEnter={() => setHoveredId('download')}
            onMouseLeave={() => setHoveredId(null)}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-discord-dark hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center transition-all duration-200 shadow-md"
            title="Baixar Aplicativos para PC ou Celular"
          >
            <Download className="w-5 h-5" />
          </button>
          <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-discord-floating text-discord-header text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-discord-darkest">
              Baixar Aplicativos
            </div>
          </div>
        </div>
      </div>

      {/* Custom Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: contextMenu.x + 10 }}
          className="fixed bg-discord-floating border border-discord-darkest rounded-lg shadow-2xl p-1.5 w-52 text-xs text-discord-header z-50 animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold text-discord-muted uppercase tracking-wider truncate">
            {contextMenu.server.name}
          </div>

          <button
            onClick={() => {
              openServerSettings(contextMenu.server);
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-discord-blurple hover:text-white rounded flex items-center justify-between transition"
          >
            <span>Configurações do Servidor</span>
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.server.invite_code);
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-discord-blurple hover:text-white rounded flex items-center justify-between transition"
          >
            <span>Copiar Código de Convite</span>
            <UserPlus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              selectServer(contextMenu.server);
              openCreateChannelModal();
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-discord-blurple hover:text-white rounded flex items-center justify-between transition"
          >
            <span>Criar Canal</span>
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="h-[1px] bg-discord-darkest my-1" />

          {currentUser?.id === contextMenu.server.owner_id ? (
            <button
              onClick={() => {
                openServerSettings(contextMenu.server);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 text-discord-red hover:bg-discord-red hover:text-white rounded flex items-center justify-between transition font-medium"
            >
              <span>Excluir Servidor</span>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={async () => {
                if (window.confirm(`Deseja sair do servidor ${contextMenu.server.name}?`)) {
                  await leaveServer(contextMenu.server.id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 text-discord-red hover:bg-discord-red hover:text-white rounded flex items-center justify-between transition font-medium"
            >
              <span>Sair do Servidor</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
