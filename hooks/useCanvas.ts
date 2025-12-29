import { useState, useEffect } from 'react';
import { ChatNode, OpenRouterModel, Message, ViewState } from '../types';
import { fetchModels, chatCompletion } from '../services/openRouterService';

const INITIAL_POS = { x: 100, y: 100 };

interface UseCanvasReturn {
    nodes: ChatNode[];
    setNodes: React.Dispatch<React.SetStateAction<ChatNode[]>>;
    models: OpenRouterModel[];
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    addInitialNode: () => void;
    handleBranch: (parentId: string) => void;
    handleSendMessage: (nodeId: string, text: string) => Promise<void>;
    clearData: (setView: (view: ViewState) => void, setIsLoggedIn: (val: boolean) => void, setIsRegistered: (val: boolean) => void) => void;
}

export const useCanvas = (currentUser: string): UseCanvasReturn => {
    const [nodes, setNodes] = useState<ChatNode[]>([]);
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Load nodes when currentUser changes
    useEffect(() => {
        if (currentUser) {
            const storedNodes = localStorage.getItem(`canvasNodes_${currentUser}`);
            if (storedNodes) {
                setNodes(JSON.parse(storedNodes));
            } else {
                setNodes([]);
            }
        } else {
            setNodes([]);
        }
    }, [currentUser]);

    // Persist nodes
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(`canvasNodes_${currentUser}`, JSON.stringify(nodes));
        }
    }, [nodes, currentUser]);

    // Fetch models
    useEffect(() => {
        if (currentUser) {
            const apiKey = localStorage.getItem(`openRouterApiKey_${currentUser}`) || '';
            fetchModels(apiKey).then(setModels);
        } else {
            setModels([]);
        }
    }, [currentUser]);

    const addInitialNode = () => {
        const newNode: ChatNode = {
            id: Math.random().toString(36).substr(2, 9),
            parentId: null,
            x: INITIAL_POS.x,
            y: INITIAL_POS.y,
            model: 'google/gemini-pro',
            messages: [],
        };
        setNodes([newNode]);
    };

    const handleBranch = (parentId: string) => {
        if (nodes.length >= 10) {
            alert('Maximum of 10 nodes reached.');
            return;
        }
        const parent = nodes.find(n => n.id === parentId);
        if (!parent) return;

        const newNode: ChatNode = {
            id: Math.random().toString(36).substr(2, 9),
            parentId: parentId,
            x: parent.x + 420,
            y: parent.y + 100,
            model: parent.model,
            messages: [...parent.messages],
        };
        setNodes([...nodes, newNode]);
    };

    const handleSendMessage = async (nodeId: string, text: string) => {
        const apiKey = localStorage.getItem(`openRouterApiKey_${currentUser}`);
        if (!apiKey) {
            alert('Please set your OpenRouter API Key in Settings first.');
            setIsSettingsOpen(true);
            return;
        }

        const userMsg: Message = { role: 'user', content: text };
        setNodes(prev => prev.map(n =>
            n.id === nodeId ? { ...n, messages: [...n.messages, userMsg], isThinking: true } : n
        ));

        try {
            const node = nodes.find(n => n.id === nodeId);
            const history = [...(node?.messages || []), userMsg];
            const reply = await chatCompletion(apiKey, node?.model || 'google/gemini-pro', history);

            const assistantMsg: Message = { role: 'assistant', content: reply };
            setNodes(prev => prev.map(n =>
                n.id === nodeId ? { ...n, messages: [...n.messages, assistantMsg], isThinking: false } : n
            ));
        } catch (error: any) {
            alert(`Error: ${error.message}`);
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isThinking: false } : n));
        }
    };

    const clearData = (
        setView: (view: ViewState) => void,
        setIsLoggedIn: (val: boolean) => void,
        setIsRegistered: (val: boolean) => void
    ) => {
        if (window.confirm('Are you sure you want to clear all data and reset the canvas?')) {
            localStorage.removeItem('canvasNodes'); // Legacy clearing
            localStorage.removeItem(`canvasNodes_${currentUser}`);
            localStorage.removeItem('isRegistered');
            localStorage.removeItem('isLoggedIn');
            setNodes([]);
            setIsLoggedIn(false);
            setIsRegistered(false);
            setView('landing');
        }
    };

    return {
        nodes,
        setNodes,
        models,
        isSettingsOpen,
        setIsSettingsOpen,
        addInitialNode,
        handleBranch,
        handleSendMessage,
        clearData
    };
};
