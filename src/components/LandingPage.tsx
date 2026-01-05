import React, { useState, useEffect } from 'react';
import { Sparkles, Home as HomeIcon, Sun, Moon, Zap, Layers, Monitor, MessageSquare, Target, Check, Mail, Github, X } from 'lucide-react';

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;

interface LandingPageProps {
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    onGetStarted: () => void;
}

const WaitlistModal = ({ isOpen, onClose, isDarkMode }: { isOpen: boolean; onClose: () => void; isDarkMode: boolean }) => {
    const [result, setResult] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setResult("Sending...");

        const formData = new FormData(event.target as HTMLFormElement);
        formData.append("access_key", WEB3FORMS_KEY);

        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            setResult("Success! You've been added to the waitlist.");
            (event.target as HTMLFormElement).reset();
            setTimeout(() => {
                onClose();
                setResult("");
            }, 3000);
        } else {
            console.log("Error", data);
            setResult(data.message || "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="rounded-3xl p-8 max-w-md w-full shadow-2xl relative border bg-[var(--bg-card)] border-[var(--border-primary)] text-[var(--text-primary)]">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full transition-colors hover:bg-[var(--bg-primary)]">
                    <X size={20} />
                </button>
                <div className="mb-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 font-bold bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                        <Sparkles size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Join the Waitlist</h3>
                    <p className="opacity-70">Get early access to Cloud Pro features including collaboration and flagship models.</p>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 opacity-70">Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-claude-accent transition-all ${isDarkMode ? 'bg-claude-bg-dark border-claude-border-dark text-claude-text-dark placeholder:text-claude-text-secondary-dark' : 'bg-claude-bg border-claude-border text-claude-text placeholder:text-claude-text-secondary'}`}
                            placeholder="Your Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 opacity-70">Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-claude-accent transition-all ${isDarkMode ? 'bg-claude-bg-dark border-claude-border-dark text-claude-text-dark placeholder:text-claude-text-secondary-dark' : 'bg-claude-bg border-claude-border text-claude-text placeholder:text-claude-text-secondary'}`}
                            placeholder="Your Email"
                        />
                    </div>
                    <textarea name="message" className="hidden" defaultValue="Requesting access to Cloud Pro Waitlist"></textarea>

                    {result && <p className={`text-sm ${result.includes("Success") ? "text-green-500" : "text-red-500"} font-medium`}>{result}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-claude-accent hover:opacity-90 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? "Joining..." : "Join Waitlist"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ContactForm = ({ isDarkMode }: { isDarkMode: boolean }) => {
    const [result, setResult] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setResult("Sending...");

        const formData = new FormData(event.target as HTMLFormElement);
        formData.append("access_key", WEB3FORMS_KEY);
        formData.append("subject", "New Contact Form Submission from Canvas AI");

        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            setResult("Message sent! We'll get back to you soon.");
            (event.target as HTMLFormElement).reset();
        } else {
            console.log("Error", data);
            setResult(data.message || "Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    };

    const inputClasses = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all ${isDarkMode ? 'bg-claude-bg-dark border-claude-border-dark text-claude-text-dark placeholder:text-claude-text-secondary-dark' : 'bg-claude-bg border-claude-border text-claude-text placeholder:text-claude-text-secondary'}`;

    return (
        <form onSubmit={onSubmit} className="space-y-5 text-left">
            <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">Name</label>
                <input
                    type="text"
                    name="name"
                    required
                    className={inputClasses}
                    placeholder="Your Name"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">Email</label>
                <input
                    type="email"
                    name="email"
                    required
                    className={inputClasses}
                    placeholder="Your Email"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">Message</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    className={inputClasses}
                    placeholder="How can we help you?"
                />
            </div>

            {result && <p className={`text-sm ${result.includes("sent") ? "text-green-500" : result === "Sending..." ? "opacity-70" : "text-red-500"} font-medium text-center`}>{result}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? "Sending..." : "Send Message"}
            </button>
        </form>
    );
};

const ImageLightbox = ({ isOpen, onClose, src, alt }: { isOpen: boolean; onClose: () => void; src: string; alt: string }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-zoom-out"
            onClick={onClose}
        >
            <img
                src={src}
                alt={alt}
                className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ isDarkMode, setIsDarkMode, onGetStarted }) => {
    const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

    return (
        <div id="top" className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] scroll-smooth selection:bg-[var(--accent-primary)]/30">
            <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} isDarkMode={isDarkMode} />
            <ImageLightbox
                isOpen={lightboxImage !== null}
                onClose={() => setLightboxImage(null)}
                src={lightboxImage?.src ?? ''}
                alt={lightboxImage?.alt ?? ''}
            />

            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-4 fixed top-0 w-full z-50 backdrop-blur-md border-b border-[var(--border-primary)]/50">
                <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                    <div className="p-1.5 bg-[var(--accent-primary)] rounded-lg"><Sparkles size={20} className="text-white" /></div>
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
                        className="px-5 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-[var(--accent-primary)]/20 active:scale-95"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Home Section */}
            <section className="pt-48 pb-20 px-6 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-bold mb-6 animate-fade-in">
                    <Sparkles size={14} /> POWERED BY OPENROUTER
                </div>
                <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
                    Orchestrate Your <br />
                    <span className="text-[var(--accent-primary)]">Intelligence</span>
                </h1>
                <p className="text-xl md:text-2xl opacity-60 mb-12 max-w-2xl mx-auto leading-relaxed">
                    The ultimate 2D spatial workspace to branch, compare, and scale parallel conversations across hundreds of LLMs.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={onGetStarted}
                        className="w-full sm:w-auto px-10 py-5 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl shadow-[var(--accent-primary)]/20"
                    >
                        Enter the Canvas <Zap size={20} fill="currentColor" />
                    </button>
                    <a
                        href="#overview"
                        className="w-full sm:w-auto px-10 py-5 border border-[var(--border-primary)] hover:bg-[var(--bg-card)]/10 rounded-2xl font-bold text-lg transition-all text-center"
                    >
                        See How it Works
                    </a>
                </div>

            </section>

            {/* Overview Section */}
            <section id="overview" className="py-32 px-6 max-w-7xl mx-auto">

                <div className="grid md:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div>
                            <span className="text-[var(--accent-primary)] font-bold tracking-widest text-sm uppercase mb-2 block">INNOVATION</span>
                            <h3 className="text-3xl md:text-4xl font-bold mb-4">A New Way to Interact with AI</h3>
                            <p className="opacity-60 text-lg leading-relaxed mb-8">
                                Stop juggling tabs. Master parallel thought with the help of Canvas AI.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/30 transition-all">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Layers className="text-[var(--accent-primary)]" /> Dynamic Branching
                            </h3>
                            <p className="opacity-60 text-lg leading-relaxed">
                                Fork any conversation at any point to test different prompts, parameters, or models. Never lose your creative flow again.
                            </p>
                        </div>
                        <div className={`p-8 rounded-3xl ${isDarkMode ? 'bg-claude-border-dark/30 border-claude-border-dark' : 'bg-card border-claude-border'} border hover:border-claude-accent/30 transition-all`}>
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Monitor className="text-indigo-500" /> Spatial Intelligence
                            </h3>
                            <p className="opacity-60 text-lg leading-relaxed">
                                Organize your ideas visually on an infinite 2D plane. Cluster related tasks and navigate your thought history with ease.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-[100px] rounded-full"></div>
                        <img
                            src="/images/branching.png"
                            className="relative rounded-3xl border border-zinc-500/20 shadow-2xl w-full cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
                            alt="Canvas AI Branching Feature"
                            onClick={() => setLightboxImage({ src: '/images/branching.png', alt: 'Canvas AI Branching Feature' })}
                        />
                    </div>
                </div>
            </section>

            {/* Product / Features Section */}
            <section id="product" className="py-32 bg-[var(--bg-primary)] border-y border-[var(--border-primary)]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Unrivaled Power</h2>
                        <p className="opacity-60 max-w-2xl mx-auto text-lg">Every feature is designed for professional prompt engineers and power users.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Instant Snapshots",
                                desc: "Save any conversation state instantly and return to it later. Ideal for A/B testing prompts and paths.",
                                icon: <Sparkles className="text-yellow-500" />
                            },
                            {
                                title: "Multi-Model Hub",
                                desc: "Access hundreds of models via OpenRouter to balance speed, cost, and reasoning.",
                                icon: <Zap className="text-[var(--accent-primary)]" />
                            },
                            {
                                title: "Privacy First",
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
                                title: "Infinite 2D Canvas",
                                desc: "Scale your orchestration on an endless spatial workspace for complex multi-step reasoning tasks.",
                                icon: <MessageSquare className="text-orange-500" />
                            }
                        ].map((f, i) => (
                            <div key={i} className="group p-10 rounded-[40px] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/40 transition-all duration-500">
                                <div className="mb-6 p-4 bg-[var(--bg-primary)] rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
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
                    {/* Individual / Free (Blue Style) */}
                    {/* Free Plan */}
                    <div className="p-12 rounded-[50px] bg-[var(--bg-card)] border border-[var(--border-primary)] text-left hover:scale-[1.02] transition-transform duration-500">
                        <h3 className="text-2xl font-bold mb-2">Free</h3>
                        <p className="opacity-80 mb-8">For personal use and exploration.</p>
                        <div className="text-6xl font-black mb-8">€0</div>
                        <ul className="space-y-6 mb-12">
                            {["Up to 10 nodes per canvas", "OpenRouter Integration", "Local Persistent Storage"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 font-medium">
                                    <Check size={20} className="text-[var(--accent-primary)]" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={onGetStarted} className="w-full py-5 bg-[var(--bg-primary)] text-[var(--text-primary)] hover:scale-105 border border-[var(--border-primary)] rounded-2xl font-black transition-all shadow-lg">Get started</button>
                    </div>

                    {/* Cloud Pro (Zinc Style) */}
                    {/* Cloud Pro (Highlighted) */}
                    {/* Cloud Pro (Highlighted) */}
                    <div className="p-12 rounded-[50px] bg-[var(--accent-primary)] border border-[var(--accent-primary)] text-left relative overflow-hidden shadow-2xl shadow-[var(--accent-primary)]/20 hover:scale-[1.02] transition-transform duration-500">
                        <div className="absolute top-8 right-8 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white">Coming Soon</div>
                        <h3 className="text-2xl font-bold mb-2 text-white">Cloud Pro</h3>
                        <p className="opacity-80 mb-8 text-white">For professional teams and researchers.</p>
                        <div className="text-6xl font-black mb-8 text-white">€20 <span className="text-sm font-normal opacity-50">/ month</span></div>
                        <ul className="space-y-6 mb-12 text-white">
                            {["Up to 50 nodes per canvas", "Access to flagships models", "Collaborative Canvases"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 font-medium opacity-90">
                                    <Check size={20} className="text-white" /> {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setIsWaitlistOpen(true)} className="w-full py-5 bg-white text-[var(--accent-primary)] hover:opacity-90 rounded-2xl font-black transition-all shadow-xl">Join Waitlist</button>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-32 px-6 max-w-3xl mx-auto">
                <div className="p-12 md:p-16 rounded-[40px] bg-[var(--bg-card)] border border-[var(--border-primary)] relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--accent-primary)]/10 rounded-full blur-[100px]"></div>
                    <div className="text-center mb-10">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Get in Touch</h2>
                        <p className="text-lg opacity-60 max-w-md mx-auto">Have questions or feedback? We'd love to hear from you.</p>
                    </div>
                    <ContactForm isDarkMode={isDarkMode} />
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

