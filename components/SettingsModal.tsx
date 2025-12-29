import React, { useState, useEffect } from 'react';
import { X, Layers, Key, Trash2 } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClearData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onClearData }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('openRouterApiKey');
        if (storedKey) setApiKey(storedKey);
    }, [isOpen]);

    const handleSaveKey = () => {
        localStorage.setItem('openRouterApiKey', apiKey);
        onClose();
    };

    const handleClearKey = () => {
        localStorage.removeItem('openRouterApiKey');
        setApiKey('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black flex items-center gap-3"><Layers size={24} className="text-blue-500" /> Settings</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-6 mb-10">
                    {/* API Key Section */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60">OpenRouter API Key</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-or-..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl pl-12 pr-12 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all font-mono"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                            >
                                {showKey ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                        <div className="flex justify-between gap-3">
                            <button onClick={handleSaveKey} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all">Save Key</button>
                            {apiKey && <button onClick={handleClearKey} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded-xl font-bold text-sm transition-all">Clear Key</button>}
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Your key is stored locally in your browser. We never see it. <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Get a key here</a>.
                        </p>
                    </div>

                    <hr className="border-zinc-800" />

                    {/* Danger Zone */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 block text-red-400">Danger Zone</label>
                        <button onClick={onClearData} className="w-full py-4 border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                            <Trash2 size={18} /> Clear All App Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
