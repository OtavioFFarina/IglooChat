import React, { useState, useEffect, useRef } from 'react';
import { IglooChatProvider, useIglooChat } from './context/IglooChatContext';
import { ServerRail } from './components/ServerRail';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { VoiceStage } from './components/VoiceStage';
import { MemberList } from './components/MemberList';
import { DirectMessagesView } from './components/DirectMessagesView';
import { CreateServerModal } from './components/CreateServerModal';
import { JoinServerModal } from './components/JoinServerModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { IncomingCallModal } from './components/IncomingCallModal';
import { AuthScreen } from './components/AuthScreen';
import { UserContextMenu } from './components/UserContextMenu';
import { UserProfileModal } from './components/UserProfileModal';
import { RemoteAudioContainer } from './components/RemoteAudioContainer';
import { MentionNotificationBanner } from './components/MentionNotificationBanner';
import { DownloadAppModal } from './components/DownloadAppModal';
import { MobileScreenNoticeModal } from './components/MobileScreenNoticeModal';
import { X } from 'lucide-react';

const IglooChatApp: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    isLoadingAuth,
    currentServer,
    currentDM,
    activeStageView,
    isCreateServerOpen,
    isJoinServerOpen,
    isCreateChannelOpen,
    isUserSettingsOpen,
    isServerSettingsOpen,
    serverSettingsTarget,
    closeServerSettings,
    directCall,
    userContextMenu,
    closeUserContextMenu,
    profileModalUser,
    closeProfileModal,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isDownloadModalOpen,
    isMobileScreenNoticeOpen,
    appearanceSettings
  } = useIglooChat();

  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const touchState = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    isDragging: boolean;
    isEligible: boolean;
    determined: boolean;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    isEligible: false,
    determined: false,
  });

  // On screens < 1024px, start with member list closed
  const [isMemberListOpen, setIsMemberListOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  const activeTheme = appearanceSettings?.theme || 'dark';

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobileNavOpen]);

  // Mobile Touch Swipe & Drag Gesture Handler (Menu Arrastável)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth >= 768 || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      // When drawer is closed, allow swiping from anywhere on the chat screen (except extreme right margin)
      // When drawer is open, swiping left anywhere closes it
      const isEligible = !isMobileNavOpen ? startX <= window.innerWidth - 20 : true;

      touchState.current = {
        startX,
        startY,
        startTime: Date.now(),
        isDragging: false,
        isEligible,
        determined: false,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.innerWidth >= 768 || e.touches.length !== 1) return;
      const state = touchState.current;
      if (!state.isEligible) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;

      if (!state.determined) {
        if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
          // Vertical scroll detected: cancel drawer drag so page scrolls smoothly
          state.isEligible = false;
          state.determined = true;
          return;
        }
        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal gesture confirmed
          if (!isMobileNavOpen && deltaX > 0) {
            state.isDragging = true;
            state.determined = true;
          } else if (isMobileNavOpen && deltaX < 0) {
            state.isDragging = true;
            state.determined = true;
          } else {
            state.isEligible = false;
            state.determined = true;
            return;
          }
        }
      }

      if (state.isDragging) {
        if (e.cancelable) e.preventDefault();
        if (drawerRef.current) {
          const drawerWidth = drawerRef.current.offsetWidth || 312;
          let offset = 0;

          if (!isMobileNavOpen) {
            offset = Math.min(0, -drawerWidth + Math.max(0, deltaX));
          } else {
            offset = Math.min(0, Math.max(-drawerWidth, deltaX));
          }

          drawerRef.current.style.transition = 'none';
          drawerRef.current.style.transform = `translateX(${offset}px)`;

          if (backdropRef.current) {
            const progress = Math.max(0, Math.min(1, (offset + drawerWidth) / drawerWidth));
            backdropRef.current.style.display = 'block';
            backdropRef.current.style.opacity = `${progress * 0.75}`;
            backdropRef.current.style.transition = 'none';
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const state = touchState.current;
      if (state.isDragging && drawerRef.current) {
        const touch = e.changedTouches[0];
        const deltaX = touch ? touch.clientX - state.startX : 0;
        const duration = Math.max(1, Date.now() - state.startTime);
        const velocity = deltaX / duration;
        const drawerWidth = drawerRef.current.offsetWidth || 312;

        // Reset inline overrides so smooth CSS classes take effect
        drawerRef.current.style.transition = '';
        drawerRef.current.style.transform = '';
        if (backdropRef.current) {
          backdropRef.current.style.transition = '';
          backdropRef.current.style.opacity = '';
          backdropRef.current.style.display = '';
        }

        if (!isMobileNavOpen) {
          if (deltaX > 45 || velocity > 0.2) {
            setIsMobileNavOpen(true);
          } else {
            setIsMobileNavOpen(false);
          }
        } else {
          if (deltaX < -45 || velocity < -0.2) {
            setIsMobileNavOpen(false);
          } else {
            setIsMobileNavOpen(true);
          }
        }
      }

      touchState.current.isDragging = false;
      touchState.current.isEligible = false;
      touchState.current.determined = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isMobileNavOpen, setIsMobileNavOpen]);

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen bg-discord-darkest flex flex-col items-center justify-center space-y-4 select-none">
        <div className="w-16 h-16 rounded-2xl bg-discord-blurple flex items-center justify-center text-white shadow-2xl animate-pulse">
          <svg className="w-10 h-10" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
          </svg>
        </div>
        <div className="text-discord-header text-sm font-semibold tracking-wide animate-pulse">
          Carregando o IglooChat...
        </div>
      </div>
    );
  }

  // Not authenticated -> Show Discord Login / Register screen
  if (!isAuthenticated || !currentUser) {
    return <AuthScreen />;
  }

  return (
    <div data-theme={activeTheme} className="flex h-full h-[100dvh] w-full overflow-hidden bg-discord-darkest font-sans text-discord-normal antialiased relative">
      {/* Mobile Drawer Backdrop Overlay */}
      <div 
        ref={backdropRef}
        onClick={() => setIsMobileNavOpen(false)}
        className={`fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300 ${
          isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* 1 & 2. Navigation Drawer (ServerRail + Sidebar) */}
      <div 
        ref={drawerRef}
        className={`fixed md:static top-0 bottom-0 left-0 z-40 md:z-auto flex h-full transition-transform duration-300 ease-out md:translate-x-0 ${
          isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Leftmost Server Rail (72px) */}
        <ServerRail />

        {/* Channels & DMs Sidebar */}
        <Sidebar />
      </div>

      {/* 3. Center Main Workspace (100% full width on mobile, flex-1 on desktop) */}
      <div className="flex-1 flex overflow-hidden h-full relative w-full">
        {activeStageView === 'voice' ? (
          /* Fullscreen Video & Screen Sharing Stage */
          <VoiceStage />
        ) : (
          /* Normal Chat or Friends View */
          <>
            {currentServer === null && currentDM === null ? (
              <DirectMessagesView />
            ) : (
              <ChatArea
                onToggleMemberList={() => setIsMemberListOpen(!isMemberListOpen)}
                isMemberListOpen={isMemberListOpen}
              />
            )}

            {/* 4. Right Member List Rail (Desktop and Mobile Drawer) */}
            {currentServer && isMemberListOpen && (
              <>
                {/* Mobile backdrop for member list */}
                <div 
                  onClick={() => setIsMemberListOpen(false)}
                  className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                />
                
                <div className="fixed lg:static top-0 bottom-0 right-0 z-40 lg:z-auto h-full shadow-2xl lg:shadow-none flex flex-col">
                  {/* Close button on mobile member list */}
                  <div className="lg:hidden flex items-center justify-between p-3 bg-discord-darker border-b border-discord-floating text-xs font-bold text-white">
                    <span>Membros do Servidor</span>
                    <button 
                      onClick={() => setIsMemberListOpen(false)}
                      className="p-1 rounded hover:bg-white/10 text-discord-muted hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <MemberList />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modals & Overlays */}
      {isCreateServerOpen && <CreateServerModal />}
      {isJoinServerOpen && <JoinServerModal />}
      {isCreateChannelOpen && <CreateChannelModal />}
      {isUserSettingsOpen && <UserSettingsModal />}
      {isServerSettingsOpen && serverSettingsTarget && (
        <ServerSettingsModal server={serverSettingsTarget} onClose={closeServerSettings} />
      )}
      {directCall?.status === 'incoming' && <IncomingCallModal />}
      {userContextMenu && (
        <UserContextMenu
          user={userContextMenu.user}
          position={{ x: userContextMenu.x, y: userContextMenu.y }}
          onClose={closeUserContextMenu}
        />
      )}
      {profileModalUser && (
        <UserProfileModal
          user={profileModalUser}
          onClose={closeProfileModal}
        />
      )}
      {isDownloadModalOpen && <DownloadAppModal />}
      {isMobileScreenNoticeOpen && <MobileScreenNoticeModal />}

      {/* Top Center Mention Notification Banner Toast */}
      <MentionNotificationBanner />

      {/* Global persistent WebRTC audio playback container */}
      <RemoteAudioContainer />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[IglooChat ErrorBoundary] Uncaught runtime error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-discord-darkest flex items-center justify-center p-4 select-none text-white font-sans">
          <div className="max-w-md w-full bg-discord-dark border border-discord-floating rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-discord-red/20 text-discord-red mx-auto flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Ops! Algo deu errado</h2>
            <p className="text-xs text-discord-muted leading-relaxed">
              O IglooChat encontrou uma falha temporária. Você pode tentar recarregar a página ou restaurar as configurações padrão.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-discord-blurple hover:bg-discord-blurple-hover rounded-lg text-xs font-semibold shadow transition"
              >
                Recarregar Página
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-discord-darker hover:bg-discord-darkhover text-discord-header rounded-lg text-xs font-semibold transition"
              >
                Limpar Cache & Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <IglooChatProvider>
        <IglooChatApp />
      </IglooChatProvider>
    </ErrorBoundary>
  );
}
