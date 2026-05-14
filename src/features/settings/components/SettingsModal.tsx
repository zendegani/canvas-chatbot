import React, { useState, useEffect } from 'react';
import { Trash2, Settings, Eye, EyeOff, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { ProviderId } from '../../canvas/types';
import {
    PROVIDERS,
    PROVIDER_LIST,
    apiKeyStorageKey,
    encodeApiKey,
    decodeApiKey,
    tavilyKeyStorageKey,
    loadPhoenixConfig,
    savePhoenixConfig,
    type PhoenixConfig,
} from '../../canvas/services/providers';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: string;
    refreshModels: () => void;
    selectedProvider: ProviderId;
    onProviderChange: (id: ProviderId) => void;
}

type PhoenixStatus = 'idle' | 'checking' | 'ok' | 'error';

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, currentUser, refreshModels, selectedProvider, onProviderChange,
}) => {
    const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>({
        openrouter: '', openai: '', google: '',
    });
    const [tavilyKey, setTavilyKey] = useState('');
    const [phoenix, setPhoenix] = useState<PhoenixConfig>({ endpoint: '', apiKey: '', project: '' });
    const [phoenixStatus, setPhoenixStatus] = useState<PhoenixStatus>('idle');
    const [phoenixStatusMsg, setPhoenixStatusMsg] = useState<string>('');
    const [showKey, setShowKey] = useState<ProviderId | 'tavily' | 'phoenix' | null>(null);

    useEffect(() => {
        if (isOpen && currentUser) {
            const loaded: Record<ProviderId, string> = { openrouter: '', openai: '', google: '' };
            for (const p of PROVIDER_LIST) {
                loaded[p.id] = decodeApiKey(localStorage.getItem(apiKeyStorageKey(p.id, currentUser)));
            }
            setApiKeys(loaded);
            setTavilyKey(decodeApiKey(localStorage.getItem(tavilyKeyStorageKey(currentUser))));
            const ph = loadPhoenixConfig(currentUser);
            setPhoenix(ph ?? { endpoint: '', apiKey: '', project: '' });
            setPhoenixStatus('idle');
            setPhoenixStatusMsg('');
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
        savePhoenixConfig(currentUser, phoenix.endpoint.trim() ? phoenix : null);
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
            savePhoenixConfig(currentUser, null);
            window.location.reload();
        }
    };

    const testPhoenix = async () => {
        const url = phoenix.endpoint.trim();
        if (!url) {
            setPhoenixStatus('error');
            setPhoenixStatusMsg('Endpoint is empty.');
            return;
        }
        setPhoenixStatus('checking');
        setPhoenixStatusMsg('');
        try {
            const res = await fetch(`${url.replace(/\/$/, '')}/`, { method: 'HEAD' });
            if (res.ok || res.status < 500) {
                setPhoenixStatus('ok');
                setPhoenixStatusMsg(`Reached (HTTP ${res.status})`);
            } else {
                setPhoenixStatus('error');
                setPhoenixStatusMsg(`Server responded with HTTP ${res.status}`);
            }
        } catch (err) {
            setPhoenixStatus('error');
            setPhoenixStatusMsg(err instanceof Error ? err.message : 'Unreachable');
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings className="w-5 h-5" />
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="llm" className="py-2">
                    <TabsList>
                        <TabsTrigger value="llm">LLM Providers</TabsTrigger>
                        <TabsTrigger value="tools">Tools</TabsTrigger>
                        <TabsTrigger value="tracing">Tracing</TabsTrigger>
                    </TabsList>

                    {/* ─── LLM Providers ─────────────────────────────────────────── */}
                    <TabsContent value="llm" className="space-y-5">
                        <div className="space-y-2">
                            <Label>Active provider</Label>
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

                        <p className="text-xs text-muted-foreground">
                            Keys are stored locally in your browser. Only the active provider's key is used for chat.
                        </p>
                    </TabsContent>

                    {/* ─── Tools ────────────────────────────────────────────────── */}
                    <TabsContent value="tools" className="space-y-5">
                        <div className="space-y-2">
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
                                Optional. Enables the per-node Search tool (Globe icon in the composer). Get a key at{' '}
                                <a href="https://tavily.com" target="_blank" rel="noreferrer" className="underline hover:text-foreground">tavily.com</a>.
                            </p>
                        </div>
                    </TabsContent>

                    {/* ─── Tracing ──────────────────────────────────────────────── */}
                    <TabsContent value="tracing" className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            Send LLM traces to Arize Phoenix to inspect prompts, responses, tool calls, latency, and tokens.
                            Leave blank to disable. Falls back to <code className="px-1 py-0.5 bg-muted rounded">PHOENIX_COLLECTOR_ENDPOINT</code> from <code className="px-1 py-0.5 bg-muted rounded">.env.local</code> if set.
                        </p>

                        <div className="space-y-2">
                            <Label>Collector endpoint</Label>
                            <Input
                                value={phoenix.endpoint}
                                onChange={(e) => setPhoenix(p => ({ ...p, endpoint: e.target.value }))}
                                placeholder="http://localhost:6006"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>API key <span className="font-normal text-muted-foreground">(optional — required for Arize Cloud)</span></Label>
                            <div className="relative">
                                <Input
                                    type={showKey === 'phoenix' ? 'text' : 'password'}
                                    value={phoenix.apiKey || ''}
                                    onChange={(e) => setPhoenix(p => ({ ...p, apiKey: e.target.value }))}
                                    placeholder="Empty for local Phoenix"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(prev => prev === 'phoenix' ? null : 'phoenix')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showKey === 'phoenix' ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Project name <span className="font-normal text-muted-foreground">(optional)</span></Label>
                            <Input
                                value={phoenix.project || ''}
                                onChange={(e) => setPhoenix(p => ({ ...p, project: e.target.value }))}
                                placeholder="canvas-ai"
                            />
                        </div>

                        <div className="flex gap-2 items-center">
                            <Button variant="outline" size="sm" onClick={testPhoenix} disabled={!phoenix.endpoint.trim() || phoenixStatus === 'checking'}>
                                {phoenixStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> :
                                 phoenixStatus === 'ok' ? <CheckCircle2 size={14} className="text-green-500" /> :
                                 phoenixStatus === 'error' ? <XCircle size={14} className="text-destructive" /> : null}
                                Test connection
                            </Button>
                            {phoenix.endpoint.trim() && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(phoenix.endpoint.replace(/\/$/, ''), '_blank')}
                                    className="gap-1"
                                >
                                    Open UI <ExternalLink size={12} />
                                </Button>
                            )}
                            {phoenixStatusMsg && (
                                <span className={`text-xs ${phoenixStatus === 'ok' ? 'text-green-500' : 'text-destructive'}`}>
                                    {phoenixStatusMsg}
                                </span>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="pt-4 border-t space-y-3">
                    <Button onClick={handleSave} className="w-full">
                        Save Changes
                    </Button>

                    <div>
                        <Label className="text-xs font-bold uppercase tracking-widest text-destructive mb-2 block">Danger Zone</Label>
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
