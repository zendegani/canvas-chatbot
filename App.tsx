
import React, { useState, useEffect } from 'react';
import { ViewState, ChatNode, OpenRouterModel, Message } from './types';
import { fetchModels, chatCompletion } from './services/openRouterService';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { Canvas } from './components/Canvas';
import { SettingsModal } from './components/SettingsModal';

const INITIAL_POS = { x: 100, y: 100 };

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(localStorage.getItem('isLoggedIn') === 'true');
  const [isRegistered, setIsRegistered] = useState<boolean>(localStorage.getItem('isRegistered') === 'true');
  const [currentUser, setCurrentUser] = useState<string>(localStorage.getItem('currentUser') || '');
  const [nodes, setNodes] = useState<ChatNode[]>([]);
  // Load nodes when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const storedNodes = localStorage.getItem(`canvasNodes_${currentUser}`);
      if (storedNodes) {
        setNodes(JSON.parse(storedNodes));
      } else {
        setNodes([]);
      }
    } else {
      setNodes([]);
    }
  }, [currentUser]);

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`canvasNodes_${currentUser}`, JSON.stringify(nodes));
    }
  }, [nodes, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const apiKey = localStorage.getItem(`openRouterApiKey_${currentUser}`) || '';
      fetchModels(apiKey).then(setModels);
    } else {
      setModels([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (view === 'canvas') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [view]);

  // ... (existing code)

  const handleSendMessage = async (nodeId: string, text: string) => {
    const apiKey = localStorage.getItem(`openRouterApiKey_${currentUser}`);
    if (!apiKey) {
      alert('Please set your OpenRouter API Key in Settings first.');
      setIsSettingsOpen(true);
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, messages: [...n.messages, userMsg], isThinking: true } : n
    ));

    try {
      const node = nodes.find(n => n.id === nodeId);
      const history = [...(node?.messages || []), userMsg];
      const reply = await chatCompletion(apiKey, node?.model || 'google/gemini-pro', history);

      const assistantMsg: Message = { role: 'assistant', content: reply };
      setNodes(prev => prev.map(n =>
        n.id === nodeId ? { ...n, messages: [...n.messages, assistantMsg], isThinking: false } : n
      ));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isThinking: false } : n));
    }
  };

  return (
    <>
      {view === 'landing' && (
        <LandingPage
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onGetStarted={handleGetStarted}
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
            onClearData={clearData}
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
