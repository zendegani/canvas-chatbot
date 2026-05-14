
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { LandingPage } from './features/landing';
import { Auth, useAuth } from './features/auth';
import { Canvas, useCanvas } from './features/canvas';
import { SettingsModal } from './features/settings';
import { Toaster } from "@/components/ui/sonner"
import { useTheme } from './hooks/useTheme';

// Extend window object to include umami
declare global {
  interface Window {
    umami?: umami.umami;
  }
}

const App: React.FC = () => {
  const {
    isLoggedIn,
    currentUser,
    view,
    setView,
    handleSignupSubmit,
    handleLoginSubmit,
    handleSocialLogin,
    handleLogout,
  } = useAuth();

  const {
    nodes,
    setNodes,
    models,
    isSettingsOpen,
    setIsSettingsOpen,
    addInitialNode,
    handleBranch,
    handleSendMessage,
    handleCompareMessage,
    handleMergeDuel,
    clearChatHistory,
    hasLoaded,
    refreshModels,
    updateNodeSize,
    sessions,
    activeSessionId,
    createSession,
    loadSession,
    deleteSession,
    selectedProvider,
    setSelectedProvider,
    hasTavilyKey,
    toggleNodeSearch,
    stopNode,
  } = useCanvas(currentUser);

  const { mode: themeMode, isDark: isDarkMode, cycleMode: cycleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (view === 'canvas') {
      document.body.style.overflow = 'hidden';
      if (hasLoaded && nodes.length === 0 && !activeSessionId) {
        addInitialNode();
      }
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [view, nodes.length, addInitialNode, hasLoaded, activeSessionId]);

  // Track page views for SPA navigation via Umami
  useEffect(() => {
    if (view === 'loading') return; // Don't track the transient loading state

    const pageMap: Record<string, string> = {
      landing: '/', signup: '/Auth', login: '/Auth', canvas: '/Canvas'
    };

    // Optional Chaining (?.) handles the "Is Umami loaded yet?" check perfectly
    window.umami?.track((props: any) => ({
      ...props,
      url: pageMap[view] || `/${view}`,
      title: view.charAt(0).toUpperCase() + view.slice(1),
    }));
  }, [view]);

  // Loading state while Better-Auth checks the session cookie
  if (view === 'loading') {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {view === 'landing' && (
        <LandingPage
          isDarkMode={isDarkMode}
          themeMode={themeMode}
          cycleTheme={cycleTheme}
          onGetStarted={() => {
            if (isLoggedIn) {
              setView('canvas');
            } else {
              setView('login');
            }
          }}
        />
      )}

      {(view === 'signup' || view === 'login') && (
        <Auth
          view={view}
          setView={setView}
          onLogin={handleLoginSubmit}
          onSignup={handleSignupSubmit}
          onSocialLogin={handleSocialLogin}
          themeMode={themeMode}
          cycleTheme={cycleTheme}
        />
      )}

      {view === 'canvas' && (
        <>
          <Canvas
            nodes={nodes}
            models={models}
            setNodes={setNodes}
            onAddInitialNode={addInitialNode}
            onClearChatHistory={() => {
              if (confirm('Delete all chat sessions for this account? Settings and API keys are kept.')) {
                clearChatHistory();
              }
            }}
            onLogout={handleLogout}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onGoHome={() => setView('landing')}
            handleBranch={handleBranch}
            handleSendMessage={handleSendMessage}
            handleCompareMessage={handleCompareMessage}
            handleMergeDuel={handleMergeDuel}
            isMobile={isMobile}
            themeMode={themeMode}
            cycleTheme={cycleTheme}
            updateNodeSize={updateNodeSize}
            currentUser={currentUser}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onCreateSession={createSession}
            onLoadSession={loadSession}
            onDeleteSession={deleteSession}
            hasTavilyKey={hasTavilyKey}
            onToggleSearch={toggleNodeSearch}
            onStopMessage={stopNode}
          />
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentUser={currentUser}
            refreshModels={refreshModels}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            onClearChatHistory={clearChatHistory}
          />
        </>
      )}
      <Toaster />
    </>
  );
};

export default App;
