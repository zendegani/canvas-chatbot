import React from 'react';
import { Sparkles } from 'lucide-react';

interface AuthProps {
    view: 'signup' | 'login';
    setView: (view: 'signup' | 'login' | 'landing') => void;
    onLogin: (e: React.FormEvent) => void;
    onSignup: (e: React.FormEvent) => void;
}

export const Auth: React.FC<AuthProps> = ({ view, setView, onLogin, onSignup }) => {
    const isSignup = view === 'signup';
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6 selection:bg-claude-accent/30 text-[var(--text-primary)]">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-block p-4 bg-claude-accent rounded-2xl mb-6 cursor-pointer shadow-2xl shadow-claude-accent/30" onClick={() => setView('landing')}>
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
                    <p className="opacity-60">{isSignup ? 'Start your journey with Canvas AI' : 'Sign in to access your workspace'}</p>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[40px] p-10 shadow-2xl text-[var(--text-primary)]">
                    <form onSubmit={isSignup ? onSignup : onLogin}>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-widest text-[10px]">Email Address</label>
                                <input name="email" type="email" required placeholder="name@company.com" className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-claude-accent outline-none text-[var(--text-primary)] transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-widest text-[10px]">Password</label>
                                <input name="password" type="password" required placeholder="••••••••" className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-claude-accent outline-none text-[var(--text-primary)] transition-all" />
                            </div>
                            <button type="submit" className="w-full py-5 bg-claude-accent hover:opacity-90 text-white rounded-2xl font-black transition-all shadow-xl shadow-claude-accent/20 active:scale-95">
                                {isSignup ? 'Sign up' : 'Login'}
                            </button>
                        </div>
                    </form>
                    <div className="mt-8 text-center text-sm opacity-60">
                        {isSignup ? "Already have an account? " : "Don't have an account? "}
                        <button onClick={() => setView(isSignup ? 'login' : 'signup')} className="text-claude-accent font-bold hover:underline">
                            {isSignup ? 'Login here' : 'Sign up here'}
                        </button>
                    </div>
                </div>
                <button onClick={() => setView('landing')} className="w-full mt-8 text-sm opacity-40 hover:opacity-100 transition-opacity font-bold">← Back to Home</button>
            </div>
        </div>
    );
};
