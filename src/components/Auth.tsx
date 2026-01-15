import React from 'react';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface AuthProps {
    view: 'signup' | 'login';
    setView: (view: 'signup' | 'login' | 'landing') => void;
    onLogin: (e: React.FormEvent) => void;
    onSignup: (e: React.FormEvent) => void;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ view, setView, onLogin, onSignup, isDarkMode, setIsDarkMode }) => {
    const isSignup = view === 'signup';
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6 selection:bg-claude-accent/30 text-[var(--text-primary)] relative">
            {/* Theme Toggle */}
            {/* Theme Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="absolute top-6 right-6 rounded-full hover:bg-zinc-500/10"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-block p-4 bg-[var(--accent-primary)] rounded-2xl mb-6 cursor-pointer shadow-2xl shadow-[var(--accent-primary)]/30" onClick={() => setView('landing')}>
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
                    <p className="opacity-60">{isSignup ? 'Start your journey with Canvas AI' : 'Sign in to access your workspace'}</p>
                </div>
                <Card className="rounded-[40px] shadow-2xl border-primary/20">
                    <CardContent className="p-10">
                        <form onSubmit={isSignup ? onSignup : onLogin}>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[10px] opacity-70">Email Address</Label>
                                    <Input name="email" type="email" required placeholder="name@company.com" className="h-12 rounded-2xl px-5" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[10px] opacity-70">Password</Label>
                                    <Input name="password" type="password" required placeholder="••••••••" className="h-12 rounded-2xl px-5" />
                                </div>
                                <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-2xl font-black shadow-xl shadow-primary/20">
                                    {isSignup ? 'Sign up' : 'Login'}
                                </Button>
                            </div>
                        </form>
                        <div className="mt-8 text-center text-sm opacity-60">
                            {isSignup ? "Already have an account? " : "Don't have an account? "}
                            <Button variant="link" onClick={() => setView(isSignup ? 'login' : 'signup')} className="text-primary font-bold p-0 h-auto">
                                {isSignup ? 'Login here' : 'Sign up here'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Button variant="ghost" onClick={() => setView('landing')} className="w-full mt-8 opacity-40 hover:opacity-100 hover:bg-transparent">
                    ← Back to Home
                </Button>
            </div>
        </div>
    );
};
