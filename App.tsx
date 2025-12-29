
import React, { useState, useEffect, useRef } from 'react';
import { Settings, LogOut, Info, Trash2, Github, Moon, Sun, Monitor, Layers, Sparkles, MessageSquare, Zap, Target, Mail, Plus, Home as HomeIcon, X, Check } from 'lucide-react';
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

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (e.target === canvasRef.current) {
      setIsPanning(true);
    }
  };

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
      <div id="top" className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'} scroll-smooth selection:bg-blue-500/30`}>
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
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-zinc-500/10 rounded-full transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={handleGetStarted}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-48 pb-20 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold mb-6 animate-fade-in">
            <Sparkles size={14} /> NOW POWERED BY GEMINI 3.0
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
            Orchestrate Your <br />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Intelligence</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-60 mb-12 max-w-2xl mx-auto leading-relaxed">
            The ultimate 2D spatial workspace to branch, compare, and scale parallel conversations across hundreds of LLMs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleGetStarted} 
              className="w-full sm:w-auto px-10 py-5 bg-white text-zinc-950 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl shadow-white/10"
            >
              Enter the Canvas <Zap size={20} fill="currentColor" />
            </button>
            <a 
              href="#overview" 
              className="w-full sm:w-auto px-10 py-5 border border-zinc-500/20 rounded-2xl font-bold text-lg hover:bg-zinc-500/5 transition-all text-center"
            >
              See How it Works
            </a>
          </div>
          <div className="mt-24 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <img 
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200" 
              className="relative rounded-3xl border border-zinc-500/20 shadow-2xl mx-auto transform group-hover:scale-[1.01] transition-all duration-500" 
              alt="Canvas AI Interface Preview" 
            />
          </div>
        </section>

        {/* Overview Section */}
        <section id="overview" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Master Parallel Thought</h2>
            <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-500/10 hover:border-blue-500/30 transition-all">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Layers className="text-blue-500" /> Dynamic Branching
                </h3>
                <p className="opacity-60 text-lg leading-relaxed">
                  Fork any conversation at any point to test different prompts, parameters, or models. Never lose your creative flow again.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-500/10 hover:border-blue-500/30 transition-all">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Monitor className="text-indigo-500" /> Spatial Intelligence
                </h3>
                <p className="opacity-60 text-lg leading-relaxed">
                  Organize your ideas visually on an infinite 2D plane. Cluster related tasks and navigate your thought history with ease.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800" 
                className="relative rounded-3xl border border-zinc-500/20 shadow-2xl w-full" 
                alt="Feature Showcase" 
              />
            </div>
          </div>
        </section>

        {/* Product / Features Section */}
        <section id="product" className="py-32 bg-zinc-900/30 border-y border-zinc-500/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Unrivaled Power</h2>
              <p className="opacity-60 max-w-2xl mx-auto text-lg">Every feature is designed for professional prompt engineers and power users.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  title: "Instant Snapshots", 
                  desc: "Save the state of any conversation and return to it later. Perfect for A/B testing prompts.", 
                  icon: <Sparkles className="text-yellow-500" /> 
                },
                { 
                  title: "Multi-Model Hub", 
                  desc: "Compare Gemini 3 Flash and Pro side-by-side to find the perfect balance of speed and logic.", 
                  icon: <Zap className="text-blue-500" /> 
                },
                { 
                  title: "Local Privacy", 
                  desc: "Your canvas data stays in your browser's local storage. We don't store your secrets.", 
                  icon: <Target className="text-red-500" /> 
                },
                { 
                  title: "Auto-Context", 
                  desc: "Inherit parent node history automatically when branching, maintaining a perfect thread of logic.", 
                  icon: <Layers className="text-indigo-500" /> 
                },
                { 
                  title: "Keyboard Mastery", 
                  desc: "Navigate your canvas at the speed of thought with optimized shortcuts and hotkeys.", 
                  icon: <Monitor className="text-emerald-500" /> 
                },
                { 
                  title: "Unlimited Nodes", 
                  desc: "Scale your orchestration up to 10 nodes per canvas for complex multi-step reasoning tasks.", 
                  icon: <MessageSquare className="text-orange-500" /> 
                }
              ].map((f, i) => (
                <div key={i} className="group p-10 rounded-[40px] bg-zinc-950 border border-zinc-500/10 hover:border-blue-500/40 transition-all duration-500">
                  <div className="mb-6 p-4 bg-zinc-900 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                  <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                  <p className="opacity-50 leading-relaxed text-lg">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-6 max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">Simple. Transparent. Built for You.</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="p-12 rounded-[50px] bg-zinc-900/50 border border-zinc-500/10 text-left hover:scale-[1.02] transition-transform duration-500">
              <h3 className="text-2xl font-bold mb-2">Individual</h3>
              <p className="opacity-50 mb-8">For personal use and exploration.</p>
              <div className="text-6xl font-black mb-8">$0 <span className="text-sm font-normal opacity-30">/ forever</span></div>
              <ul className="space-y-6 mb-12">
                {["10 Draggable Nodes", "Gemini 3 Flash Access", "Local Persistent Storage", "Visual Connections", "Lifetime Updates"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium opacity-80">
                    <Check size={20} className="text-blue-500" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={handleGetStarted} className="w-full py-5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-black transition-all">Start Now</button>
            </div>
            <div className="p-12 rounded-[50px] bg-blue-600 border border-blue-400/20 text-left relative overflow-hidden shadow-2xl shadow-blue-600/20 hover:scale-[1.02] transition-transform duration-500">
              <div className="absolute top-8 right-8 bg-white/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md">Popular</div>
              <h3 className="text-2xl font-bold mb-2 text-white">Cloud Pro</h3>
              <p className="opacity-80 mb-8 text-white">For professional teams and researchers.</p>
              <div className="text-6xl font-black mb-8 text-white">Custom <span className="text-sm font-normal opacity-60">/ project</span></div>
              <ul className="space-y-6 mb-12 text-white">
                {["Unlimited Nodes", "Full Model Suite", "Cloud Synced Workspaces", "Collaborative Canvases", "API Integration Hub"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium">
                    <Check size={20} className="text-white" /> {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-5 bg-white text-blue-600 hover:bg-zinc-100 rounded-2xl font-black transition-all shadow-xl">Contact Sales</button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-32 px-6 max-w-5xl mx-auto text-center">
          <div className="p-20 rounded-[60px] bg-zinc-900 border border-zinc-500/10 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>
            <h2 className="text-4xl md:text-5xl font-black mb-10">Get in Touch</h2>
            <p className="text-xl opacity-60 mb-12 max-w-xl mx-auto">Have questions or feedback? We'd love to hear from you as we build the future of AI orchestration.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <a href="mailto:hello@canvasai.io" className="flex items-center gap-3 px-8 py-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-all font-bold text-lg group-hover:scale-105 duration-300">
                <Mail size={24} className="text-blue-500" /> hello@canvasai.io
               </a>
               <a href="https://github.com" target="_blank" className="flex items-center gap-3 px-8 py-4 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-all font-bold text-lg group-hover:scale-105 duration-300">
                <Github size={24} className="text-white" /> Source Code
               </a>
            </div>
          </div>
        </section>

        <footer className="py-20 px-6 text-center border-t border-zinc-500/10 opacity-40 text-sm">
          <div className="mb-4 font-bold text-lg flex items-center justify-center gap-2">
            <Sparkles size={18} /> Canvas AI
          </div>
          <p>© 2025 Canvas AI Project. Built for the modern orchestrator.</p>
        </footer>
      </div>
    );
  }

  if (view === 'signup' || view === 'login') {
    const isSignup = view === 'signup';
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 selection:bg-blue-500/30">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-blue-600 rounded-2xl mb-6 cursor-pointer shadow-2xl shadow-blue-600/30" onClick={() => setView('landing')}>
              <Sparkles size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="opacity-60">{isSignup ? 'Start your journey with Canvas AI' : 'Sign in to access your workspace'}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-[40px] p-10 shadow-2xl">
            <form onSubmit={isSignup ? handleSignupSubmit : handleLoginSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-widest text-[10px]">Email Address</label>
                  <input name="email" type="email" required placeholder="name@company.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-widest text-[10px]">Password</label>
                  <input name="password" type="password" required placeholder="••••••••" className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all" />
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                  {isSignup ? 'Sign up' : 'Login'}
                </button>
              </div>
            </form>
            <div className="mt-8 text-center text-sm opacity-60">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button onClick={() => setView(isSignup ? 'login' : 'signup')} className="text-blue-500 font-bold hover:underline">
                {isSignup ? 'Login here' : 'Sign up here'}
              </button>
            </div>
          </div>
          <button onClick={() => setView('landing')} className="w-full mt-8 text-sm opacity-40 hover:opacity-100 transition-opacity font-bold">← Back to Home</button>
        </div>
      </div>
    );
  }

  // Canvas Workspace
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col relative selection:bg-blue-500/30">
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
            <div className="text-xs font-bold opacity-50 uppercase tracking-widest text-[10px]">{nodes.length}/10 Nodes</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold">
              <Settings size={18} /> <span className="hidden sm:inline">Settings</span>
            </button>
            <button onClick={clearData} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl text-xs font-bold transition-colors">
              <Trash2 size={18} /> <span className="hidden sm:inline">Clear</span>
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><LogOut size={18} /></button>
          </div>
        </div>

        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black flex items-center gap-3"><Layers size={24} className="text-blue-500" /> Canvas Info</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <p className="text-lg opacity-60 mb-8 leading-relaxed font-medium">Infinite workspace powered by Gemini. Models are orchestrated in parallel via a visual grid.</p>
              <div className="space-y-4 mb-10">
                {[
                  { label: "AI Engine", val: "Gemini 3 Flash/Pro" },
                  { label: "Storage", val: "Local Device" },
                  { label: "Status", val: "Operational" }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-zinc-800/50 rounded-2xl border border-zinc-700">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-40">{item.label}</span>
                    <span className="text-sm font-bold text-blue-400">{item.val}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl active:scale-95">Close Settings</button>
            </div>
          </div>
        )}

        {nodes.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
             <div className="p-12 bg-zinc-900 border border-zinc-700 rounded-[50px] text-center max-w-sm pointer-events-auto shadow-2xl scale-in">
                <div className="p-5 bg-blue-600 inline-block rounded-3xl mb-8 shadow-2xl shadow-blue-600/30 animate-bounce"><MessageSquare size={40} /></div>
                <h3 className="text-2xl font-black mb-4">Your canvas is empty</h3>
                <p className="opacity-50 mb-10 font-medium">Create a root node to start your first orchestration.</p>
                <button onClick={addInitialNode} className="w-full py-4 bg-white text-zinc-950 rounded-2xl font-black text-lg hover:bg-zinc-200 transition-all active:scale-95">Create Node</button>
             </div>
          </div>
        )}

        <div className="mt-auto flex justify-between items-end pointer-events-auto">
          <div className="p-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-xl flex items-center gap-4">
             <div className="flex gap-3 text-xs font-bold text-zinc-400">
               <span className="px-3 py-1.5 bg-zinc-800 rounded-xl border border-zinc-700">Drag headers to Move</span>
               <span className="px-3 py-1.5 bg-zinc-800 rounded-xl border border-zinc-700">Snap Branches with +</span>
             </div>
          </div>
          <button onClick={addInitialNode} className="p-6 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/30 hover:scale-110 active:scale-95 transition-all animate-fade-in"><Plus size={32} /></button>
        </div>
      </div>
    </div>
  );
};

export default App;
