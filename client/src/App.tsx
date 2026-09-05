import React, { useState } from 'react';
import { ConcordProvider, useConcord } from './context/ConcordContext';
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
import { IncomingCallModal } from './components/IncomingCallModal';

const ConcordApp: React.FC = () => {
  const {
    currentServer,
    currentDM,
    activeStageView
  } = useConcord();

  const [isMemberListOpen, setIsMemberListOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-discord-darkest font-sans text-discord-normal antialiased">
      {/* 1. Leftmost Server Rail (72px) */}
      <ServerRail />

      {/* 2. Channels & DMs Sidebar (240px) */}
      <Sidebar />

      {/* 3. Center Main Workspace */}
      <div className="flex-1 flex overflow-hidden h-full relative">
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

            {/* 4. Right Member List Rail (inside servers) */}
            {currentServer && isMemberListOpen && <MemberList />}
          </>
        )}
      </div>

      {/* Modals & Overlays */}
      <CreateServerModal />
      <JoinServerModal />
      <CreateChannelModal />
      <UserSettingsModal />
      <IncomingCallModal />
    </div>
  );
};

export default function App() {
  return (
    <ConcordProvider>
      <ConcordApp />
    </ConcordProvider>
  );
}
