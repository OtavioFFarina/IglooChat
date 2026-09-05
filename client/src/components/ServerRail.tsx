import React, { useState } from 'react';
import { useConcord } from '../context/ConcordContext';
import { Plus, Compass, Users } from 'lucide-react';

export const ServerRail: React.FC = () => {
  const {
    servers,
    currentServer,
    currentDM,
    selectServer,
    openCreateServerModal,
    openJoinServerModal,
    allUsers,
    currentUser,
    switchUser
  } = useConcord();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showUserQuickSwitcher, setShowUserQuickSwitcher] = useState(false);

  const isHomeActive = currentServer === null;

  return (
    <nav 
      aria-label="Servidores" 
      className="w-[72px] h-full bg-discord-darkest flex flex-col items-center py-3 flex-shrink-0 z-30 select-none border-r border-[#1a1b1e]"
    >
      {/* Concord / Direct Messages Home Button */}
      <div className="relative group w-full flex justify-center mb-2">
        {/* Left Pill Indicator */}
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
              : 'bg-[#313338] text-discord-normal hover:bg-discord-blurple hover:text-white rounded-[24px] hover:rounded-[16px]'
          }`}
        >
          {/* Discord / Concord Gamepad Controller Icon */}
          <svg className="w-7 h-7" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
          </svg>
        </button>

        {/* Tooltip */}
        <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-[#111214] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-[#232428]">
            Mensagens Diretas
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="w-8 h-[2px] bg-[#35363c] rounded mb-2" />

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
              {/* Left Pill Indicator */}
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive ? 'h-10' : hoveredId === server.id ? 'h-5' : 'h-0'
                }`}
              />

              <button
                onClick={() => selectServer(server)}
                onMouseEnter={() => setHoveredId(server.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative w-12 h-12 flex items-center justify-center font-bold text-sm tracking-wide transition-all duration-200 overflow-hidden shadow-md ${
                  isActive
                    ? 'bg-discord-blurple text-white rounded-[16px]'
                    : 'bg-[#313338] text-discord-normal hover:bg-discord-blurple hover:text-white rounded-[24px] hover:rounded-[16px]'
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

              {/* Tooltip */}
              <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <div className="bg-[#111214] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-[#232428]">
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
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center transition-all duration-200 shadow-md"
          >
            <Plus className="w-6 h-6" />
          </button>
          <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-[#111214] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-[#232428]">
              Adicionar um Servidor
            </div>
          </div>
        </div>

        {/* Explore / Join Server Button */}
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
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center transition-all duration-200 shadow-md"
          >
            <Compass className="w-6 h-6" />
          </button>
          <div className="absolute left-[82px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
            <div className="bg-[#111214] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-[#232428]">
              Entrar por Código de Convite
            </div>
          </div>
        </div>
      </div>

      {/* Quick User Switcher for Local Multi-Window Testing */}
      <div className="relative w-full flex justify-center pt-2 border-t border-[#35363c]">
        <button
          onClick={() => setShowUserQuickSwitcher(!showUserQuickSwitcher)}
          title="Alternar Usuário para Testes em Múltiplas Janelas"
          className="w-10 h-10 rounded-full bg-[#232428] hover:bg-discord-blurple text-discord-normal hover:text-white flex items-center justify-center transition-all border border-[#35373c]"
        >
          <Users className="w-5 h-5" />
        </button>

        {showUserQuickSwitcher && (
          <div className="absolute left-[80px] bottom-0 bg-[#1e1f22] border border-[#2f3136] rounded-lg p-2 shadow-2xl w-56 z-50">
            <div className="text-[11px] font-bold text-discord-muted uppercase tracking-wider px-2 py-1 mb-1">
              Trocar de Usuário (Teste):
            </div>
            <div className="space-y-1">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u);
                    setShowUserQuickSwitcher(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-2 py-1.5 rounded hover:bg-[#35373c] text-left text-xs transition ${
                    u.id === currentUser.id ? 'bg-[#35373c] text-white font-semibold' : 'text-discord-normal'
                  }`}
                >
                  <img src={u.avatar} alt={u.username} className="w-6 h-6 rounded-full object-cover" />
                  <div className="truncate flex-1">
                    <div>{u.username}</div>
                    <div className="text-[10px] text-discord-muted truncate">{u.custom_status || u.status}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
