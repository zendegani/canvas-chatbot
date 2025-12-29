
import React, { useState, useEffect, useRef } from 'react';
import { Settings, LogOut, Info, Trash2, Github, Moon, Sun, Monitor, Layers, Sparkles, MessageSquare, Zap, Target, Mail, Plus, Home as HomeIcon, X, Key } from 'lucide-react';
import { ViewState, ChatNode, OpenRouterModel, Message } from './types';
import { Node } from './components/Node';
import { ConnectionLine } from './components/ConnectionLine';
import { fetchModels, chatCompletion } from './services/openRouterService';

const INITIAL_POS = { x: 100, y: 100 };
const NODE_WIDTH = 384; 
const NODE_HEIGHT = 400; 

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(localStorage.getItem('isLoggedIn') === 'true');
  const [isRegistered, setIsRegistered] = useState<boolean>(localStorage.getItem('isRegistered') === 'true');
  // API key is handled via process.env.API_KEY per guidelines; removing local state/storage management for it.
  const [nodes, setNodes] = useState<ChatNode[]>(JSON.parse(localStorage.getItem('canvasNodes') || '[]'));
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [draggedNode, setDraggedNode] = useState<{ id: string; startX: number; startY: number; mouseX: number; mouseY: number } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('canvasNodes', JSON.stringify(nodes));
  }, [nodes]);

  // Load Gemini models on component mount
  useEffect(() => {
    fetchModels('').then(setModels);
  }, []);

  useEffect(() => {
    if (view === 'canvas') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [view]);

  // Fix: Added missing onMouseDown handler for canvas panning
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only pan on left click
    setIsPanning(true);
  };

  // Fix: Added missing onMouseMove handler for canvas panning and node dragging
  const onMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    } else if (draggedNode) {
      const dx = e.clientX - draggedNode.mouseX;
      const dy = e.clientY - draggedNode.mouseY;
      
      setNodes(prev => prev.map(n => 
        n.id === draggedNode.id 
          ? { ...n, x: draggedNode.startX + dx, y: draggedNode.startY + dy } 
          : n
      ));
    }
  };

  // Fix: Added missing onMouseUp handler to end panning and dragging
  const onMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  // Fix: Added missing handleNodeDragStart handler for moving nodes
  const handleNodeDragStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    setDraggedNode({
      id,
      startX: node.x,
      startY: node.y,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
  };

  // Fix: Added missing deleteNode handler
  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  };

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

  const addInitialNode = () => {
    const newNode: ChatNode = {
      id: Math.random().toString(36).substr(2, 9),
      parentId: null,
      x: INITIAL_POS.x,
      y: INITIAL_POS.y,
      model: 'gemini-3-flash-preview', 
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
    const userMsg: Message = { role: 'user', content: text };
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, messages: [...n.messages, userMsg], isThinking: true } : n
    ));

    try {
      const node = nodes.find(n => n.id === nodeId);
      const history = [...(node?.messages || []), userMsg];
      // Using Gemini API service with the current model
      const reply = await chatCompletion('', node?.model || 'gemini-3-flash-preview', history);
      
      const assistantMsg: Message = { role: 'assistant', content: reply };
      setNodes(prev => prev.map(n => 
        n.id === nodeId ? { ...n, messages: [...n.messages, assistantMsg], isThinking: false } : n
      ));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isThinking: false } : n));
    }
  };

  if (view === 'landing') {
    return (
      <div id="top" className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'} scroll-smooth`}>
        <nav className="flex items-center justify-between px-6 py-4 fixed top-0 w-full z-50 backdrop-blur-md border-b border-zinc-500/10">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="p-1.5 bg-blue-600 rounded-lg"><Sparkles size={20} className="text-white" /></div>
            <span>Canvas AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium opacity-70">
            <a href="#top" className="hover:opacity-100 transition-opacity flex items-center gap-1.5"><HomeIcon size={14} /> Home</a>
            <a href="#overview" className="hover:opacity-100 transition-opacity">Overview</a>
            <a href="#product" className="hover:opacity-100 transition-opacity">Product</a>
            <a href="#pricing" className="hover:opacity-100 transition-opacity">Pricing</a>
            <a href="#contact" className="hover:opacity-100 transition-opacity">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-zinc-500/10 rounded-full">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={handleGetStarted}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              Get Started
            </button>
          </div>
        </nav>

        <section className="pt-48 pb-20 px-6 text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Orchestrate Your <br /> Intelligence
          </h1>
          <p className="text-lg md:text-xl opacity-60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Infinite 2D spatial workspace for parallel AI conversations using Gemini.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={handleGetStarted} className="px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-xl">
              Enter the Canvas <Zap size={18} fill="currentColor" />
            </button>
          </div>
          <div className="mt-20 relative">
            <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200" className="rounded-3xl border border-zinc-500/20 shadow-2xl mx-auto" alt="Preview" />
          </div>
        </section>

        <section id="overview" className="py-32 px-6 max-w-7xl mx-auto">
           <div className="grid md:grid-cols-2 gap-16 items-center">
             <div>
               <h2 className="text-4xl font-bold mb-6">Master Parallel Thought</h2>
               <p className="opacity-60 text-lg mb-8 leading-relaxed">Canvas AI lets you branch thoughts into new nodes, comparing different Gemini models side-by-side in a spatial layout that mirrors human brainstorming.</p>
             </div>
             <div className="bg-zinc-900 rounded-3xl p-1 border border-zinc-500/10 shadow-2xl">
               <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800" className="rounded-[22px] w-full" alt="Feature" />
             </div>
           </div>
        </section>

        <footer className="py-12 px-6 text-center border-t border-zinc-500/10 opacity-40 text-sm">© 2025 Canvas AI.</footer>
      </div>
    );
  }

  if (view === 'signup' || view === 'login') {
    const isSignup = view === 'signup';
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-blue-600 rounded-2xl mb-6 cursor-pointer" onClick={() => setView('landing')}>
              <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-bold">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="opacity-60">{isSignup ? 'Start your journey with Canvas AI' : 'Sign in to access your workspace'}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={isSignup ? handleSignupSubmit : handleLoginSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">Email Address</label>
                  <input name="email" type="email" required placeholder="name@company.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">Password</label>
                  <input name="password" type="password" required placeholder="••••••••" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-xl">
                  {isSignup ? 'Sign up' : 'Login'}
                </button>
              </div>
            </form>
            <div className="mt-6 text-center text-sm opacity-60">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button onClick={() => setView(isSignup ? 'login' : 'signup')} className="text-blue-500 font-bold hover:underline">
                {isSignup ? 'Login here' : 'Sign up here'}
              </button>
            </div>
          </div>
          <button onClick={() => setView('landing')} className="w-full mt-6 text-sm opacity-40 hover:opacity-100 transition-opacity">← Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col">
      <div 
        ref={canvasRef}
        className="absolute inset-0 grid-bg cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ backgroundPosition: `${panOffset.x}px ${panOffset.y}px` }}
      >
        <div className="relative w-full h-full pointer-events-none" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
          {nodes.map(node => {
            if (!node.parentId) return null;
            const parent = nodes.find(n => n.id === node.parentId);
            if (!parent) return null;
            return <ConnectionLine key={`${parent.id}-${node.id}`} startX={parent.x + NODE_WIDTH} startY={parent.y + NODE_HEIGHT / 4} endX={node.x} endY={node.y + NODE_HEIGHT / 4} />;
          })}
          {nodes.map(node => (
            <div key={node.id} className="pointer-events-auto">
              <Node node={node} models={models} onDelete={deleteNode} onBranch={handleBranch} onSendMessage={handleSendMessage} onUpdateModel={(id, m) => setNodes(prev => prev.map(n => n.id === id ? { ...n, model: m } : n))} onDragStart={handleNodeDragStart} isMobile={isMobile} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-50 pointer-events-none w-full h-full flex flex-col p-6">
        <div className="flex items-center justify-between w-full pointer-events-auto bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-3 px-5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold cursor-pointer" onClick={() => setView('landing')}>
              <div className="p-1 bg-blue-600 rounded-md"><Sparkles size={16} /></div>
              <span>Canvas AI</span>
            </div>
            <div className="h-4 w-px bg-zinc-700"></div>
            <div className="text-xs opacity-50">{nodes.length}/10 Nodes</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2 text-xs font-medium">
              <Settings size={18} /> <span className="hidden sm:inline">Settings</span>
            </button>
            <button onClick={clearData} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl text-xs font-medium">
              <Trash2 size={18} /> <span className="hidden sm:inline">Clear</span>
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-xl"><LogOut size={18} /></button>
          </div>
        </div>

        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><Layers size={20} className="text-blue-500" /> Platform Info</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <p className="text-sm opacity-60 mb-6 leading-relaxed">Infinite 2D spatial workspace powered by the latest Gemini models.</p>
              <div className="space-y-6">
                <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-xs text-zinc-400 space-y-2">
                  <p>• Multi-model orchestration</p>
                  <p>• Dynamic node branching</p>
                  <p>• Automated context propagation</p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-xl">Close</button>
              </div>
            </div>
          </div>
        )}

        {nodes.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
             <div className="p-8 bg-zinc-900 border border-zinc-700 rounded-[40px] text-center max-w-sm pointer-events-auto shadow-2xl">
                <div className="p-4 bg-blue-600 inline-block rounded-2xl mb-6"><MessageSquare size={32} /></div>
                <h3 className="text-xl font-bold mb-3">Your canvas is empty</h3>
                <button onClick={addInitialNode} className="px-8 py-3 bg-white text-zinc-950 rounded-full font-bold hover:bg-zinc-200 transition-all">Create Node</button>
             </div>
          </div>
        )}

        <div className="mt-auto flex justify-between items-end pointer-events-auto">
          <div className="p-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-xl flex items-center gap-4">
             <div className="flex gap-2 text-xs text-zinc-400">
               <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">Drag headers to Move</span>
               <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">Snap Branches with +</span>
             </div>
          </div>
          <button onClick={addInitialNode} className="p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"><Plus size={24} /></button>
        </div>
      </div>
    </div>
  );
};

export default App;
