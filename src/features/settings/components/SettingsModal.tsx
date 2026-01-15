import React, { useState, useEffect } from 'react';
import { X, Layers, Key, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: string;
    refreshModels: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUser, refreshModels }) => {
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
        // Refresh models with the new API key
        refreshModels();
        onClose();
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings className="w-5 h-5" />
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>OpenRouter API Key</Label>
                        <div className="relative">
                            <Input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-or-..."
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your key is stored locally in your browser and used securely to communicate with OpenRouter.
                        </p>
                    </div>

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
