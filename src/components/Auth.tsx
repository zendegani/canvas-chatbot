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
                    <form onSubmit={isSignup ? onSignup : onLogin}>
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
};
