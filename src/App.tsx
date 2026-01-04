
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { Canvas } from './components/Canvas';
import { SettingsModal } from './components/SettingsModal';
import { useAuth } from './hooks/useAuth';
import { useCanvas } from './hooks/useCanvas';

const App: React.FC = () => {
  const {
    isLoggedIn,
    currentUser,
    view,
    setView,
    handleSignupSubmit,
    handleLoginSubmit,
    handleLogout,
    setIsLoggedIn,
    setIsRegistered
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
    clearData
  } = useCanvas(currentUser);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Fallback
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (view === 'canvas') {
      document.body.style.overflow = 'hidden';
      if (nodes.length === 0) addInitialNode();
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [view, nodes.length, addInitialNode]);

  return (
    <>
      {view === 'landing' && (
        <LandingPage
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onGetStarted={() => {
            if (isLoggedIn) {
              setView('canvas');
            } else if (localStorage.getItem('isRegistered') === 'true') {
              setView('login');
            } else {
              setView('signup');
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
        />
      )}

      {view === 'canvas' && (
        <>
          <Canvas
            nodes={nodes}
            models={models}
            setNodes={setNodes}
            onAddInitialNode={addInitialNode}
            onClearData={() => clearData(setView, setIsLoggedIn, setIsRegistered)}
            onLogout={handleLogout}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onGoHome={() => setView('landing')}
            handleBranch={handleBranch}
            handleSendMessage={handleSendMessage}
            isMobile={isMobile}
          />
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentUser={currentUser}
          />
        </>
      )}
    </>
  );
};

export default App;
