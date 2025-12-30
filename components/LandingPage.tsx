import React from 'react';
import { Sparkles, Home as HomeIcon, Sun, Moon, Zap, Layers, Monitor, MessageSquare, Target, Check, Mail, Github } from 'lucide-react';

interface LandingPageProps {
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isDarkMode, setIsDarkMode, onGetStarted }) => {
    return (
        <div id="top" className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'} scroll-smooth selection:bg-blue-500/30`}>
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-4 fixed top-0 w-full z-50 backdrop-blur-md border-b border-zinc-500/10">
                <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
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
                        onClick={onGetStarted}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Home Section */}
            <section className="pt-48 pb-20 px-6 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold mb-6 animate-fade-in">
                    <Sparkles size={14} /> POWERED BY OPENROUTER
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
                        onClick={onGetStarted}
                        className={`w-full sm:w-auto px-10 py-5 ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'} rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl`}
                    >
                        Enter the Canvas <Zap size={20} fill="currentColor" />
                    </button>
                    <a
                        href="#overview"
                        className={`w-full sm:w-auto px-10 py-5 border ${isDarkMode ? 'border-zinc-500/20 hover:bg-white/5' : 'border-zinc-900/10 hover:bg-zinc-900/5'} rounded-2xl font-bold text-lg transition-all text-center`}
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
                        <div className={`p-8 rounded-3xl ${isDarkMode ? 'bg-zinc-900/50 border-zinc-500/10' : 'bg-zinc-50 border-zinc-900/5'} border hover:border-blue-500/30 transition-all`}>
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Layers className="text-blue-500" /> Dynamic Branching
                            </h3>
                            <p className="opacity-60 text-lg leading-relaxed">
                                Fork any conversation at any point to test different prompts, parameters, or models. Never lose your creative flow again.
                            </p>
                        </div>
                        <div className={`p-8 rounded-3xl ${isDarkMode ? 'bg-zinc-900/50 border-zinc-500/10' : 'bg-zinc-50 border-zinc-900/5'} border hover:border-blue-500/30 transition-all`}>
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
            <section id="product" className={`py-32 ${isDarkMode ? 'bg-zinc-900/30 border-zinc-500/10' : 'bg-zinc-50 border-zinc-900/5'} border-y`}>
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
                                desc: "Access hundreds of models via OpenRouter to find the perfect balance of speed and logic.",
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
                            <div key={i} className={`group p-10 rounded-[40px] ${isDarkMode ? 'bg-zinc-950 border-zinc-500/10' : 'bg-white border-zinc-900/10'} border hover:border-blue-500/40 transition-all duration-500`}>
                                <div className={`mb-6 p-4 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'} rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500`}>{f.icon}</div>
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
                    <div className={`p-12 rounded-[50px] ${isDarkMode ? 'bg-zinc-900/50 border-zinc-500/10' : 'bg-zinc-50 border-zinc-900/5'} border text-left hover:scale-[1.02] transition-transform duration-500`}>
                        <h3 className="text-2xl font-bold mb-2">Individual</h3>
                        <p className="opacity-50 mb-8">For personal use and exploration.</p>
                        <div className="text-6xl font-black mb-8">$0 <span className="text-sm font-normal opacity-30">/ forever</span></div>
                        <ul className="space-y-6 mb-12">
                            {["10 Draggable Nodes", "OpenRouter Integration", "Local Persistent Storage", "Visual Connections", "Lifetime Updates"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 font-medium opacity-80">
                                    <Check size={20} className="text-blue-500" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={onGetStarted} className={`w-full py-5 ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-900 text-white hover:bg-zinc-800'} rounded-2xl font-black transition-all`}>Start Now</button>
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
                <div className={`p-20 rounded-[60px] ${isDarkMode ? 'bg-zinc-900 border-zinc-500/10' : 'bg-zinc-50 border-zinc-900/5'} border relative overflow-hidden group`}>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <h2 className="text-4xl md:text-5xl font-black mb-10">Get in Touch</h2>
                    <p className="text-xl opacity-60 mb-12 max-w-xl mx-auto">Have questions or feedback? We'd love to hear from you as we build the future of AI orchestration.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <a href="mailto:hello@canvasai.io" className={`flex items-center gap-3 px-8 py-4 ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'} rounded-2xl transition-all font-bold text-lg group-hover:scale-105 duration-300`}>
                            <Mail size={24} className="text-blue-500" /> hello@canvasai.io
                        </a>
                        <a href="https://github.com" target="_blank" className={`flex items-center gap-3 px-8 py-4 ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'} rounded-2xl transition-all font-bold text-lg group-hover:scale-105 duration-300`}>
                            <Github size={24} className={isDarkMode ? 'text-white' : 'text-zinc-900'} /> Source Code
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
};
