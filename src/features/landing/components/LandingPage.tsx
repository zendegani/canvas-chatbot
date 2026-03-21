import React, { useState } from 'react';
import { Sparkles, Home as HomeIcon, Sun, Moon, Zap, Layers, Monitor, MessageSquare, Target, Swords, KeyRound } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;

interface LandingPageProps {
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    onGetStarted: () => void;
}

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
            <DialogContent
                className="w-[100vw] h-[100vh] max-w-none p-0 bg-transparent border-none shadow-none flex items-center justify-center outline-none"
                onClick={onClose}
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">{alt}</DialogTitle>
                <img
                    src={src}
                    alt={alt}
                    className="max-w-[95vw] max-h-[95vh] object-contain rounded-md shadow-2xl cursor-default"
                    onClick={(e) => e.stopPropagation()}
                />
            </DialogContent>
        </Dialog>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ isDarkMode, setIsDarkMode, onGetStarted }) => {
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

    const branchingImg = isDarkMode ? '/images/branching-dark.png' : '/images/branching-light.png';
    const duelImg = isDarkMode ? '/images/Duel-dark.png' : '/images/Duel-light.png';

    return (
        <div id="top" className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] scroll-smooth selection:bg-[var(--accent-primary)]/30">
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

                {/* Row 1 header */}
                <div className="mb-12">
                    <span className="text-[var(--accent-primary)] font-bold tracking-widest text-sm uppercase mb-2 block">INNOVATION</span>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4">A New Way to Interact with AI</h3>
                    <p className="opacity-60 text-lg leading-relaxed max-w-2xl">
                        Stop juggling tabs. Master parallel thought with the help of Canvas AI.
                    </p>
                </div>

                {/* Row 1: Boxes left, Branching image right */}
                <div className="grid md:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Layers className="text-[var(--accent-primary)]" /> Dynamic Branching
                            </h3>
                            <p className="opacity-60 text-lg leading-relaxed">
                                Fork any conversation at any point to test different prompts, parameters, or models. Never lose your creative flow again.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all">
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
                            src={branchingImg}
                            className="relative rounded-3xl border border-zinc-500/20 shadow-2xl w-full cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
                            alt="Canvas AI Branching Feature"
                            onClick={() => setLightboxImage({ src: branchingImg, alt: 'Canvas AI Branching Feature' })}
                        />
                    </div>
                </div>

                {/* Row 2: Duel image left, Boxes right (mirrored) */}
                <div className="grid md:grid-cols-2 gap-20 items-center mt-20">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                        <img
                            src={duelImg}
                            className="relative rounded-3xl border border-zinc-500/20 shadow-2xl w-full cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
                            alt="Canvas AI Model Duel Feature"
                            onClick={() => setLightboxImage({ src: duelImg, alt: 'Canvas AI Model Duel Feature' })}
                        />
                    </div>
                    <div className="space-y-8">
                        <div className="p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <Swords className="text-emerald-500" /> Model Duel
                            </h3>
                            <p className="opacity-60 text-lg leading-relaxed">
                                Pick two models at once and split-test any prompt side-by-side. Instantly compare reasoning, tone, and quality.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <KeyRound className="text-amber-500" /> Bring Your Own Key
                            </h3>
                            <p className="opacity-60 text-lg leading-relaxed">
                                Connect your own API keys from OpenRouter, OpenAI, or Google. Full control over your models and costs.
                            </p>
                        </div>
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
                                title: "Model Duel",
                                desc: "Pick two models and split-test any prompt side-by-side. Compare reasoning, tone, and quality instantly.",
                                icon: <Swords className="text-emerald-500" />
                            },
                            {
                                title: "Multi-Model Hub",
                                desc: "Access hundreds of models from OpenRouter, OpenAI, and Google to balance speed, cost, and reasoning.",
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
                                title: "Infinite 2D Canvas",
                                desc: "Scale your orchestration on an endless spatial workspace for complex multi-step reasoning tasks.",
                                icon: <MessageSquare className="text-orange-500" />
                            },
                            {
                                title: "Instant Snapshots",
                                desc: "Save any conversation state instantly and return to it later. Ideal for A/B testing prompts and paths.",
                                icon: <Sparkles className="text-yellow-500" />
                            }
                        ].map((feature, i) => (
                            <Card key={i} className="group p-2 rounded-[40px] border-primary/10 hover:border-primary/40 transition-all duration-500 overflow-hidden">
                                <CardContent className="p-8">
                                    <div className="mb-6 p-4 bg-primary/10 text-primary rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">{feature.icon}</div>
                                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                    <p className="opacity-50 leading-relaxed text-lg">{feature.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-32 px-6 max-w-3xl mx-auto">
                <div className="p-12 md:p-16 rounded-[40px] bg-card border border-border relative overflow-hidden">
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
                <p>© {new Date().getFullYear()} Canvas AI Project. Built for the modern orchestrator.</p>
            </footer>
        </div>
    );
};
