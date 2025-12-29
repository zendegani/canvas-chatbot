
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, LogOut, Info, Trash2, Github, Moon, Sun, Monitor, Layers, Sparkles, MessageSquare, Zap, Target, Mail, Plus, Home as HomeIcon } from 'lucide-react';
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
  const [nodes, setNodes] = useState<ChatNode[]>(JSON.parse(localStorage.getItem('canvasNodes') || '[]'));
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
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

  useEffect(() => {
    fetchModels().then(setModels);
  }, []);

  // Prevent body scroll only when in canvas view
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
      if (nodes.length === 0) {
        addInitialNode();
      }
    } else {
      setView('auth');
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
    setView('canvas');
    if (nodes.length === 0) {
      addInitialNode();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setView('landing');
  };

  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all data and reset the canvas?')) {
      localStorage.removeItem('canvasNodes');
      setNodes([]);
      setView('landing');
    }
  };

  const addInitialNode = () => {
    const newNode: ChatNode = {
      id: Math.random().toString(36).substr(2, 9),
      parentId: null,
      x: INITIAL_POS.x,
      y: INITIAL_POS.y,
      model: 'gemini-3-pro-preview', 
      messages: [],
    };
    setNodes([newNode]);
  };

  const handleBranch = (parentId: string) => {
    if (nodes.length >= 10) {
      alert('Maximum of 10 nodes reached for performance.');
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
      n.id === nodeId 
        ? { ...n, messages: [...n.messages, userMsg], isThinking: true } 
        : n
    ));

    try {
      const node = nodes.find(n => n.id === nodeId);
      const history = [...(node?.messages || []), userMsg];
      const reply = await chatCompletion(node?.model || 'gemini-3-flash-preview', history);
      
      const assistantMsg: Message = { role: 'assistant', content: reply };
      setNodes(prev => prev.map(n => 
        n.id === nodeId 
          ? { ...n, messages: [...n.messages, assistantMsg], isThinking: false } 
          : n
      ));
    } catch (error: any) {
      alert(`API Error: ${error.message}`);
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isThinking: false } : n));
    }
  };

  const updateNodeModel = (id: string, model: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, model } : n));
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
      setIsPanning(true);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
    if (draggedNode) {
      const dx = e.clientX - draggedNode.mouseX;
      const dy = e.clientY - draggedNode.mouseY;
      setNodes(prev => prev.map(n => 
        n.id === draggedNode.id 
          ? { ...n, x: draggedNode.startX + dx, y: draggedNode.startY + dy } 
          : n
      ));
    }
  };

  const onMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  const handleNodeDragStart = (id: string, e: React.MouseEvent) => {
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

  if (view === 'landing') {
    return (
      <div id="top" className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'} scroll-smooth`}>
        {/* Navigation */}
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

        {/* Hero */}
        <section className="pt-48 pb-20 px-6 text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Orchestrate Your <br /> Intelligence
          </h1>
          <p className="text-lg md:text-xl opacity-60 mb-10 max-w-2xl mx-auto leading-relaxed">
            A 2D canvas workspace to branch, compare, and scale conversations across Gemini models.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95"
            >
              Enter the Canvas <Zap size={18} fill="currentColor" />
            </button>
            <a href="#overview" className="px-8 py-4 border border-zinc-500/20 rounded-2xl font-bold hover:bg-zinc-500/5 transition-all">
              See How it Works
            </a>
          </div>
          <div className="mt-20 relative px-4">
            <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full"></div>
            <img 
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200" 
              className="relative rounded-3xl border border-zinc-500/20 shadow-2xl opacity-90 mx-auto"
              alt="Platform Preview"
            />
          </div>
        </section>

        {/* Overview */}
        <section id="overview" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-blue-500 font-bold mb-4 uppercase tracking-widest text-xs">Innovation</div>
              <h2 className="text-4xl font-bold mb-6">A New Way to Interact with AI</h2>
              <p className="opacity-60 text-lg mb-8 leading-relaxed">
                Stop juggling tabs. Canvas AI allows you to visualize your AI workflow on an infinite plane. Branch conversations to test different models, prompt styles, or paths without losing context.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Layers size={20} />, text: "Branch & snapshot any conversation instantly" },
                  { icon: <Monitor size={20} />, text: "Infinite 2D spatial workspace" },
                  { icon: <Zap size={20} />, text: "Compare multiple Gemini models" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10">
                    <div className="text-blue-500">{item.icon}</div>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900 rounded-3xl p-1 border border-zinc-500/10 overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800" className="rounded-[22px] w-full" alt="Feature" />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="product" className="py-24 bg-zinc-900/50 border-y border-zinc-500/10">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-16">Built for Modern Teams</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[
                { title: "Snapshot System", desc: "Inherit message history into new nodes for testing branches.", icon: <Sparkles className="text-blue-500" /> },
                { title: "Universal Gemini Access", desc: "Integrate any Gemini model via official SDK.", icon: <Zap className="text-yellow-500" /> },
                { title: "Privacy First", desc: "Your conversations are stored locally in your browser.", icon: <Target className="text-red-500" /> }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-3xl bg-zinc-950 border border-zinc-500/10 hover:border-zinc-500/30 transition-all">
                  <div className="mb-4">{f.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="opacity-60 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-32 px-6 text-center max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Simple, Fair Pricing</h2>
          <p className="opacity-60 mb-12">No subscription. Powered by Gemini.</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 rounded-3xl bg-zinc-900 border border-zinc-500/10 text-left">
              <h3 className="text-xl font-bold mb-2">Community</h3>
              <div className="text-4xl font-bold mb-6">$0 <span className="text-sm font-normal opacity-40">/ forever</span></div>
              <ul className="space-y-4 opacity-70 text-sm mb-10">
                <li className="flex items-center gap-2">✓ Use with built-in API support</li>
                <li className="flex items-center gap-2">✓ Up to 10 nodes per canvas</li>
                <li className="flex items-center gap-2">✓ Local storage persistence</li>
              </ul>
              <button onClick={handleGetStarted} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all">Start Building</button>
            </div>
            <div className="p-10 rounded-3xl bg-blue-600 border border-blue-400/20 text-left relative overflow-hidden">
               <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Enterprise</div>
              <h3 className="text-xl font-bold mb-2">Team Cloud</h3>
              <div className="text-4xl font-bold mb-6">Custom <span className="text-sm font-normal opacity-80">/ project</span></div>
              <ul className="space-y-4 opacity-90 text-sm mb-10">
                <li className="flex items-center gap-2">✓ Multi-user collaboration</li>
                <li className="flex items-center gap-2">✓ Cloud-synced canvases</li>
                <li className="flex items-center gap-2">✓ Shared team resources</li>
              </ul>
              <button className="w-full py-4 bg-white text-blue-600 hover:bg-zinc-100 rounded-2xl font-bold transition-all shadow-xl">Contact Sales</button>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-32 px-6 max-w-4xl mx-auto text-center border-t border-zinc-500/10">
          <div className="p-12 rounded-[40px] bg-zinc-900 border border-zinc-500/10">
            <h2 className="text-3xl font-bold mb-6">Ready to expand your horizon?</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
               <a href="mailto:hello@canvasai.io" className="flex items-center gap-2 px-6 py-3 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-all">
                <Mail size={18} /> hello@canvasai.io
               </a>
               <a href="https://github.com" className="flex items-center gap-2 px-6 py-3 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-all">
                <Github size={18} /> Open Source
               </a>
            </div>
          </div>
        </section>

        <footer className="py-12 px-6 text-center border-t border-zinc-500/10 opacity-40 text-sm">
          © 2025 Canvas AI. All rights reserved. Built with ❤️ for the future of orchestration.
        </footer>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-blue-600 rounded-2xl mb-6 shadow-2xl shadow-blue-600/30 cursor-pointer" onClick={() => setView('landing')}>
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="opacity-60">Sign in or create an account to start orchestrating</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleAuthSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">Email Address</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    placeholder="name@company.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">Password</label>
                  <input 
                    name="password"
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  Continue
                </button>
              </div>
            </form>
            <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-col gap-3">
              <button className="w-full py-3 bg-white text-zinc-950 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                <Github size={18} /> Continue with GitHub
              </button>
            </div>
          </div>
          <button 
            onClick={() => setView('landing')}
            className="w-full mt-6 text-sm opacity-40 hover:opacity-100 transition-opacity"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Canvas Workspace
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col relative">
      {/* Background Grid */}
      <div 
        ref={canvasRef}
        className="absolute inset-0 grid-bg cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }}
      >
        <div 
          className="relative w-full h-full pointer-events-none"
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
        >
          {/* Render Connections */}
          {nodes.map(node => {
            if (!node.parentId) return null;
            const parent = nodes.find(n => n.id === node.parentId);
            if (!parent) return null;
            return (
              <ConnectionLine 
                key={`${parent.id}-${node.id}`}
                startX={parent.x + NODE_WIDTH}
                startY={parent.y + NODE_HEIGHT / 4}
                endX={node.x}
                endY={node.y + NODE_HEIGHT / 4}
              />
            );
          })}

          {/* Render Nodes */}
          {nodes.map(node => (
            <div key={node.id} className="pointer-events-auto">
              <Node 
                node={node}
                models={models}
                onDelete={deleteNode}
                onBranch={handleBranch}
                onSendMessage={handleSendMessage}
                onUpdateModel={updateNodeModel}
                onDragStart={handleNodeDragStart}
                isMobile={isMobile}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Interface Layer */}
      <div className="relative z-50 pointer-events-none w-full h-full flex flex-col p-6">
        {/* Header Overlay */}
        <div className="flex items-center justify-between w-full pointer-events-auto bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-3 px-5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold cursor-pointer" onClick={() => setView('landing')}>
              <div className="p-1 bg-blue-600 rounded-md"><Sparkles size={16} /></div>
              <span className="hidden sm:inline">Canvas AI</span>
            </div>
            <div className="h-4 w-px bg-zinc-700 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-xs opacity-50">
              <Layers size={14} />
              <span>{nodes.length}/10 Nodes</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="p-2 hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2 text-xs font-medium"
              onClick={() => alert("Settings coming soon: Custom Themes, Export Canvas.")}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button 
              onClick={clearData}
              className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors flex items-center gap-2 text-xs font-medium"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Clear Workspace</span>
            </button>
            <div className="h-4 w-px bg-zinc-700"></div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Floating Tooltips or Instructions */}
        {nodes.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
             <div className="p-8 bg-zinc-900 border border-zinc-700 rounded-[40px] text-center max-w-sm pointer-events-auto shadow-2xl">
                <div className="p-4 bg-blue-600 inline-block rounded-2xl mb-6"><MessageSquare size={32} /></div>
                <h3 className="text-xl font-bold mb-3">Your canvas is empty</h3>
                <p className="opacity-50 text-sm mb-6">Create your first node to start orchestrating conversations across models.</p>
                <button 
                  onClick={addInitialNode}
                  className="px-8 py-3 bg-white text-zinc-950 rounded-full font-bold hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Create Root Node
                </button>
             </div>
          </div>
        )}

        <div className="mt-auto flex justify-between items-end pointer-events-auto">
          <div className="p-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-xl flex items-center gap-4">
             <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest opacity-40">
               <Info size={12} /> Keyboard
             </div>
             <div className="flex gap-2 text-xs text-zinc-400">
               <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">Middle Click/Drag to Pan</span>
               <span className="px-2 py-1 bg-zinc-800 rounded border border-zinc-700">Drag headers to Move</span>
             </div>
          </div>
          
          <button 
            onClick={addInitialNode}
            className="p-4 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:scale-110 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
