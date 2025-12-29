
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
  const [nodes, setNodes] = useState<ChatNode[]>(JSON.parse(localStorage.getItem('canvasNodes') || '[]'));
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
    localStorage.setItem('canvasNodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    const apiKey = localStorage.getItem('openRouterApiKey') || '';
    fetchModels(apiKey).then(setModels);
  }, []);

  useEffect(() => {
    if (view === 'canvas') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [view]);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      setView('canvas');
      if (nodes.length === 0) addInitialNode();
    } else if (isRegistered) {
      setView('login');
    } else {
      setView('signup');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('isRegistered', 'true');
    setIsRegistered(true);
    setView('login');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
    setView('canvas');
    if (nodes.length === 0) addInitialNode();
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setView('landing');
  };

  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all data and reset the canvas?')) {
      localStorage.removeItem('canvasNodes');
      localStorage.removeItem('isRegistered');
      localStorage.removeItem('isLoggedIn');
      setNodes([]);
      setIsLoggedIn(false);
      setIsRegistered(false);
      setView('landing');
    }
  };

  // Add logic to clear openRouterApiKey if requested via settings modal... 
  // Wait, the settings modal handles clearing the key itself from localstorage.
  // We just need to handle clearing app data.

  const addInitialNode = () => {
    const newNode: ChatNode = {
      id: Math.random().toString(36).substr(2, 9),
      parentId: null,
      x: INITIAL_POS.x,
      y: INITIAL_POS.y,
      model: 'google/gemini-pro',
      messages: [],
    };
    setNodes([newNode]);
  };

  const handleBranch = (parentId: string) => {
    if (nodes.length >= 10) {
      alert('Maximum of 10 nodes reached.');
      return;
    }
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const newNode: ChatNode = {
      id: Math.random().toString(36).substr(2, 9),
      parentId: parentId,
      x: parent.x + 420,
      y: parent.y + 100,
      model: parent.model,
      messages: [...parent.messages],
    };
    setNodes([...nodes, newNode]);
  };

  const handleSendMessage = async (nodeId: string, text: string) => {
    const apiKey = localStorage.getItem('openRouterApiKey');
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
            onClearData={clearData}
          />
        </>
      )}
    </>
  );
};

export default App;
