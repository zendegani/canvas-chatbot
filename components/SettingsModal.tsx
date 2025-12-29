import React, { useState, useEffect } from 'react';
import { X, Layers, Key, Trash2, Settings, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUser }) => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            const storedKey = localStorage.getItem(`openRouterApiKey_${currentUser}`);
            if (storedKey) setApiKey(storedKey);
            else setApiKey('');
        }
    }, [isOpen, currentUser]);

    const handleSave = () => {
        if (!currentUser) return;
        localStorage.setItem(`openRouterApiKey_${currentUser}`, apiKey);
        onClose();
        // Force reload to refresh models with new key
        window.location.reload();
    };

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
            localStorage.removeItem(`canvasNodes_${currentUser}`);
            localStorage.removeItem(`openRouterApiKey_${currentUser}`);
            window.location.reload();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            OpenRouter API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-or-..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">
                            Your key is stored locally in your browser and used securely to communicate with OpenRouter.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 block text-red-400">Danger Zone</label>
                        <button onClick={handleClearData} className="w-full py-4 border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                            <Trash2 size={18} /> Clear All App Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
