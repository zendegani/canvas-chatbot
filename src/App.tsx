
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { Canvas } from './components/Canvas';
import { SettingsModal } from './components/SettingsModal';
import { useAuth } from './hooks/useAuth';
import { useCanvas } from './hooks/useCanvas';

// Extend window object to include umami
declare global {
  interface Window {
    umami?: {
      track: (
        eventOrCallback: string | ((props: { url: string; title: string }) => { url: string; title: string }),
        data?: Record<string, unknown>
      ) => void;
    };
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
    clearData,
    hasLoaded,
    refreshModels
  } = useCanvas(currentUser);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      // First check localStorage for saved preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme !== null) {
        return savedTheme === 'dark';
      }
      // Fall back to system preference
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

  // Sync isDarkMode with DOM for Tailwind/CSS selector support and persist to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (view === 'canvas') {
      document.body.style.overflow = 'hidden';
      if (hasLoaded && nodes.length === 0) {
        addInitialNode();
      }
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [view, nodes.length, addInitialNode, hasLoaded]);

  // Track page views for SPA navigation via Umami
  useEffect(() => {
    const pageMap: Record<string, string> = {
      landing: '/',
      signup: '/Auth',
      login: '/Auth',
      canvas: '/Canvas'
    };

    const pagePath = pageMap[view] || `/${view}`;
    const pageTitle = view.charAt(0).toUpperCase() + view.slice(1);

    const trackPageView = () => {
      if (window.umami) {
        console.log('[Umami] Tracking page:', pagePath);
        window.umami.track((props) => ({
          ...props,
          url: pagePath,
          title: pageTitle,
        }));
        return true;
      }
      return false;
    };

    // Try immediately, if not available, retry with interval
    if (!trackPageView()) {
      let retries = 0;
      const maxRetries = 20; // 2 seconds max
      const interval = setInterval(() => {
        retries++;
        if (trackPageView() || retries >= maxRetries) {
          clearInterval(interval);
          if (retries >= maxRetries) {
            console.warn('[Umami] Script did not load after 2 seconds');
          }
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [view]);

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
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
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
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentUser={currentUser}
            refreshModels={refreshModels}
          />
        </>
      )}
    </>
  );
};

export default App;
