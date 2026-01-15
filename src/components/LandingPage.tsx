import React, { useState, useEffect } from 'react';
import { Sparkles, Home as HomeIcon, Sun, Moon, Zap, Layers, Monitor, MessageSquare, Target, Check, Mail, Github, X } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;

interface LandingPageProps {
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    onGetStarted: () => void;
}

const WaitlistModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Sending...");

        const formData = new FormData(event.target as HTMLFormElement);
        formData.append("access_key", WEB3FORMS_KEY);

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Success! You've been added to the waitlist.", { id: toastId });
                (event.target as HTMLFormElement).reset();
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                console.log("Error", data);
                toast.error(data.message || "Something went wrong. Please try again.", { id: toastId });
            }
        } catch (error) {
            toast.error("Network error. Please try again.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-primary/10 text-primary">
                        <Sparkles size={24} />
                    </div>
                    <DialogTitle className="text-center text-2xl">Join the Waitlist</DialogTitle>
                    <DialogDescription className="text-center">
                        Get early access to Cloud Pro features including collaboration and flagship models.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="Your Name" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="Your Email" required />
                    </div>
                    <textarea name="message" className="hidden" defaultValue="Requesting access to Cloud Pro Waitlist"></textarea>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Joining..." : "Join Waitlist"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ContactForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Sending message...");

        const formData = new FormData(event.target as HTMLFormElement);
        formData.append("access_key", WEB3FORMS_KEY);
        formData.append("subject", "New Contact Form Submission from Canvas AI");

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Message sent! We'll get back to you soon.", { id: toastId });
                (event.target as HTMLFormElement).reset();
            } else {
                console.log("Error", data);
                toast.error(data.message || "Something went wrong.", { id: toastId });
            }
        } catch (error) {
            toast.error("Network error. Please try again.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5 text-left">
            <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input id="contact-name" name="name" placeholder="Your Name" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" type="email" name="email" placeholder="Your Email" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                    id="contact-message"
                    name="message"
                    placeholder="How can we help you?"
                    required
                    className="min-h-[120px]"
                />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
        </form>
    );
};

const ImageLightbox = ({ isOpen, onClose, src, alt }: { isOpen: boolean; onClose: () => void; src: string; alt: string }) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
                <DialogTitle className="sr-only">{alt}</DialogTitle>
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-contain rounded-md"
                    onClick={(e) => e.stopPropagation()}
                />
            </DialogContent>
        </Dialog>
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
                    <Button onClick={() => setIsDarkMode(!isDarkMode)} variant="ghost" size="icon" className="rounded-full hover:bg-zinc-500/10">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </Button>
                    <Button
                        onClick={onGetStarted}
                        className="rounded-full font-semibold shadow-lg shadow-primary/20"
                    >
                        Get Started
                    </Button>
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
                    <Button
                        onClick={onGetStarted}
                        size="lg"
                        className="w-full sm:w-auto px-10 py-6 rounded-2xl text-lg shadow-2xl shadow-primary/20"
                    >
                        Enter the Canvas <Zap size={20} className="ml-2 fill-current" />
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="w-full sm:w-auto px-10 py-6 rounded-2xl text-lg hover:bg-muted/50"
                    >
                        <a href="#overview">
                            See How it Works
                        </a>
                    </Button>
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
                            <Card key={i} className="group p-2 rounded-[40px] border-primary/10 hover:border-primary/40 transition-all duration-500 overflow-hidden">
                                <CardContent className="p-8">
                                    <div className="mb-6 p-4 bg-primary/10 text-primary rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                                    <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                                    <p className="opacity-50 leading-relaxed text-lg">{f.desc}</p>
                                </CardContent>
                            </Card>
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
                    <Card className="rounded-[50px] border-primary/20 text-left hover:scale-[1.02] transition-transform duration-500">
                        <CardContent className="p-12">
                            <h3 className="text-2xl font-bold mb-2">Free</h3>
                            <p className="opacity-80 mb-8">For personal use and exploration.</p>
                            <div className="text-6xl font-black mb-8">€0</div>
                            <ul className="space-y-6 mb-12">
                                {["Up to 10 nodes per canvas", "OpenRouter Integration", "Local Persistent Storage"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 font-medium">
                                        <Check size={20} className="text-primary" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <Button onClick={onGetStarted} variant="outline" className="w-full py-6 text-lg rounded-2xl font-bold">Get started</Button>
                        </CardContent>
                    </Card>

                    {/* Cloud Pro (Zinc Style) */}
                    {/* Cloud Pro (Highlighted) */}
                    {/* Cloud Pro (Highlighted) */}
                    <Card className="rounded-[50px] bg-primary border-primary text-primary-foreground text-left relative overflow-hidden shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform duration-500">
                        <CardContent className="p-12">
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
                            <Button onClick={() => setIsWaitlistOpen(true)} className="w-full py-6 bg-white text-primary hover:bg-white/90 rounded-2xl font-bold text-lg shadow-xl">Join Waitlist</Button>
                        </CardContent>
                    </Card>
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
                    <ContactForm />
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

