import React, { useState, useEffect } from 'react';
import { Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProviderId } from '../../canvas/types';
import { PROVIDERS, PROVIDER_LIST, apiKeyStorageKey, selectedProviderKey, DEFAULT_PROVIDER, encodeApiKey, decodeApiKey, tavilyKeyStorageKey } from '../../canvas/services/providers';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: string;
    refreshModels: () => void;
    selectedProvider: ProviderId;
    onProviderChange: (id: ProviderId) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, currentUser, refreshModels, selectedProvider, onProviderChange,
}) => {
    const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>({
        openrouter: '', openai: '', google: '',
    });
    const [tavilyKey, setTavilyKey] = useState('');
    const [showKey, setShowKey] = useState<ProviderId | 'tavily' | null>(null);

    useEffect(() => {
        if (isOpen && currentUser) {
            const loaded: Record<ProviderId, string> = { openrouter: '', openai: '', google: '' };
            for (const p of PROVIDER_LIST) {
                loaded[p.id] = decodeApiKey(localStorage.getItem(apiKeyStorageKey(p.id, currentUser)));
            }
            setApiKeys(loaded);
            setTavilyKey(decodeApiKey(localStorage.getItem(tavilyKeyStorageKey(currentUser))));
            setShowKey(null);
        }
    }, [isOpen, currentUser]);

    const handleSave = () => {
        if (!currentUser) return;
        for (const p of PROVIDER_LIST) {
            const key = apiKeys[p.id].trim();
            if (key) {
                localStorage.setItem(apiKeyStorageKey(p.id, currentUser), encodeApiKey(key));
            } else {
                localStorage.removeItem(apiKeyStorageKey(p.id, currentUser));
            }
        }
        const tav = tavilyKey.trim();
        if (tav) {
            localStorage.setItem(tavilyKeyStorageKey(currentUser), encodeApiKey(tav));
        } else {
            localStorage.removeItem(tavilyKeyStorageKey(currentUser));
        }
        refreshModels();
        onClose();
    };

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
            localStorage.removeItem(`canvasNodes_${currentUser}`);
            for (const p of PROVIDER_LIST) {
                localStorage.removeItem(apiKeyStorageKey(p.id, currentUser));
            }
            localStorage.removeItem(tavilyKeyStorageKey(currentUser));
            window.location.reload();
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings className="w-5 h-5" />
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <Label>AI Provider</Label>
                        <div className="flex gap-2">
                            {PROVIDER_LIST.map(p => (
                                <Button
                                    key={p.id}
                                    variant={selectedProvider === p.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onProviderChange(p.id)}
                                    className="flex-1 text-xs"
                                >
                                    {p.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* API Keys */}
                    {PROVIDER_LIST.map(p => (
                        <div key={p.id} className="space-y-2">
                            <Label>{p.name} API Key</Label>
                            <div className="relative">
                                <Input
                                    type={showKey === p.id ? 'text' : 'password'}
                                    value={apiKeys[p.id]}
                                    onChange={(e) => setApiKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    placeholder={p.keyPlaceholder}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(prev => prev === p.id ? null : p.id)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showKey === p.id ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Tavily (web search) key */}
                    <div className="space-y-2 pt-2 border-t">
                        <Label>Tavily API Key <span className="font-normal text-muted-foreground">(web search)</span></Label>
                        <div className="relative">
                            <Input
                                type={showKey === 'tavily' ? 'text' : 'password'}
                                value={tavilyKey}
                                onChange={(e) => setTavilyKey(e.target.value)}
                                placeholder="tvly-..."
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(prev => prev === 'tavily' ? null : 'tavily')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showKey === 'tavily' ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Optional. Enables the per-node Search tool. Get a key at tavily.com.
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Keys are stored locally in your browser. Only the active provider's key is used.
                    </p>

                    <Button onClick={handleSave} className="w-full">
                        Save Changes
                    </Button>

                    <div className="pt-4 border-t">
                        <Label className="text-xs font-bold uppercase tracking-widest text-destructive mb-4 block">Danger Zone</Label>
                        <Button
                            variant="destructive"
                            onClick={handleClearData}
                            className="w-full gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 shadow-none"
                        >
                            <Trash2 size={18} /> Clear All App Data
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
