import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatNode, ChatSession, LLMModel, Message, ProviderId } from '../types';
import { fetchModels, chatCompletion } from '../services/chatService';
import { PROVIDERS, DEFAULT_PROVIDER, apiKeyStorageKey, selectedProviderKey, decodeApiKey } from '../services/providers';
import type { ViewState } from '../../auth/types';

const NODE_WIDTH = 576;
const NODE_HEIGHT = 400;
const MAX_SESSIONS = 50;
const TITLE_MAX_LENGTH = 30;

// --- localStorage helpers (scoped per user) ---

function sessionIndexKey(user: string) { return `canvasSessions_${user}`; }
function sessionDataKey(user: string, id: string) { return `canvasSession_${user}_${id}`; }
function activeSessionKey(user: string) { return `canvasActiveSession_${user}`; }
function legacyNodesKey(user: string) { return `canvasNodes_${user}`; }

function loadSessionIndex(user: string): Omit<ChatSession, 'nodes'>[] {
    try {
        const raw = localStorage.getItem(sessionIndexKey(user));
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveSessionIndex(user: string, sessions: Omit<ChatSession, 'nodes'>[]) {
    localStorage.setItem(sessionIndexKey(user), JSON.stringify(sessions));
}

function loadSessionData(user: string, id: string): ChatSession | null {
    try {
        const raw = localStorage.getItem(sessionDataKey(user, id));
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveSessionData(user: string, session: ChatSession) {
    localStorage.setItem(sessionDataKey(user, session.id), JSON.stringify(session));
}

function deleteSessionData(user: string, id: string) {
    localStorage.removeItem(sessionDataKey(user, id));
}

function generateId(): string {
    if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        if (typeof crypto.getRandomValues === 'function') {
            // Fallback: generate a UUIDv4-compatible string using secure random bytes
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);

            // Per RFC 4122 section 4.4, set version (4) and variant (10)
            bytes[6] = (bytes[6] & 0x0f) | 0x40;
            bytes[8] = (bytes[8] & 0x3f) | 0x80;

            const hex: string[] = [];
            for (let i = 0; i < bytes.length; i++) {
                hex.push(bytes[i].toString(16).padStart(2, '0'));
            }

            return (
                hex[0] + hex[1] + hex[2] + hex[3] + '-' +
                hex[4] + hex[5] + '-' +
                hex[6] + hex[7] + '-' +
                hex[8] + hex[9] + '-' +
                hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
            );
        }
    }
    // As a last resort, fall back to a simple timestamp-based ID without Math.random.
    // This avoids insecure randomness but may be more predictable; it is only used
    // when no secure crypto API is available.
    return 'session-' + Date.now().toString(36);
}

function deriveTitle(nodes: ChatNode[]): string {
    // Find the first user message across all nodes
    for (const node of nodes) {
        for (const msg of node.messages) {
            if (msg.role === 'user' && msg.content.trim()) {
                const text = msg.content.trim();
                return text.length > TITLE_MAX_LENGTH
                    ? text.slice(0, TITLE_MAX_LENGTH) + '…'
                    : text;
            }
        }
    }
    return 'New Chat';
}

// --- Hook ---

export interface UseCanvasReturn {
    nodes: ChatNode[];
    setNodes: React.Dispatch<React.SetStateAction<ChatNode[]>>;
    models: LLMModel[];
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    addInitialNode: () => void;
    handleBranch: (parentId: string, direction?: 'right' | 'bottom') => void;
    handleSendMessage: (nodeId: string, text: string) => Promise<void>;
    handleCompareMessage: (nodeId: string, text: string, compareModels: string[]) => Promise<void>;
    handleMergeDuel: (parentId: string) => Promise<void>;
    clearData: (setView: (view: ViewState) => void) => void;
    hasLoaded: boolean;
    refreshModels: () => void;
    updateNodeSize: (id: string, width: number, height: number) => void;
    // Session management
    sessions: Omit<ChatSession, 'nodes'>[];
    activeSessionId: string | null;
    createSession: () => void;
    loadSession: (id: string) => void;
    deleteSession: (id: string) => void;
    // Provider management
    selectedProvider: ProviderId;
    setSelectedProvider: (id: ProviderId) => void;
}

export const useCanvas = (currentUser: string): UseCanvasReturn => {
    const [nodes, setNodes] = useState<ChatNode[]>([]);
    const [models, setModels] = useState<LLMModel[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [sessions, setSessions] = useState<Omit<ChatSession, 'nodes'>[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [selectedProvider, setSelectedProviderState] = useState<ProviderId>(DEFAULT_PROVIDER);

    const lastUsedModelRef = useRef(PROVIDERS[DEFAULT_PROVIDER].defaultModel.id);

    // Load selected provider from localStorage on user change
    useEffect(() => {
        if (currentUser) {
            const stored = localStorage.getItem(selectedProviderKey(currentUser));
            if (stored && stored in PROVIDERS) {
                setSelectedProviderState(stored as ProviderId);
                lastUsedModelRef.current = PROVIDERS[stored as ProviderId].defaultModel.id;
            }
        }
    }, [currentUser]);

    const setSelectedProvider = useCallback((id: ProviderId) => {
        setSelectedProviderState(id);
        if (currentUser) {
            localStorage.setItem(selectedProviderKey(currentUser), id);
        }
        // Reset to default model for the new provider
        lastUsedModelRef.current = PROVIDERS[id].defaultModel.id;
    }, [currentUser]);

    // Keep last used model in sync
    useEffect(() => {
        if (nodes[0]?.model) {
            lastUsedModelRef.current = nodes[0].model;
        }
    }, [nodes]);

    // --- Migrate legacy data & load sessions on user change ---
    useEffect(() => {
        if (!currentUser) {
            setNodes([]);
            setSessions([]);
            setActiveSessionId(null);
            setHasLoaded(false);
            return;
        }

        let index = loadSessionIndex(currentUser);

        // Migrate legacy canvasNodes if no sessions exist yet
        const legacyRaw = localStorage.getItem(legacyNodesKey(currentUser));
        if (index.length === 0 && legacyRaw) {
            try {
                const legacyNodes: ChatNode[] = JSON.parse(legacyRaw);
                if (legacyNodes.length > 0) {
                    const now = Date.now();
                    const session: ChatSession = {
                        id: generateId(),
                        title: deriveTitle(legacyNodes),
                        nodes: legacyNodes,
                        createdAt: now,
                        updatedAt: now,
                    };
                    saveSessionData(currentUser, session);
                    const { nodes: _, ...meta } = session;
                    index = [meta];
                    saveSessionIndex(currentUser, index);
                    localStorage.removeItem(legacyNodesKey(currentUser));
                }
            } catch (e) {
                console.error('Failed to migrate legacy nodes', e);
            }
        }

        setSessions(index);

        // Restore active session
        const savedActiveId = localStorage.getItem(activeSessionKey(currentUser));
        const activeId = savedActiveId && index.some(s => s.id === savedActiveId)
            ? savedActiveId
            : index[0]?.id ?? null;

        if (activeId) {
            const data = loadSessionData(currentUser, activeId);
            setNodes(data?.nodes ?? []);
            setActiveSessionId(activeId);
            localStorage.setItem(activeSessionKey(currentUser), activeId);
        } else {
            setNodes([]);
            setActiveSessionId(null);
        }

        setHasLoaded(true);
    }, [currentUser]);

    // --- Auto-save current session on node changes ---
    useEffect(() => {
        if (!currentUser || !hasLoaded || !activeSessionId) return;

        const session = loadSessionData(currentUser, activeSessionId);
        if (!session) return;

        const updatedSession: ChatSession = {
            ...session,
            nodes,
            title: deriveTitle(nodes) || session.title,
            updatedAt: Date.now(),
        };
        saveSessionData(currentUser, updatedSession);

        // Update index metadata
        const { nodes: _, ...meta } = updatedSession;
        setSessions(prev => {
            const updated = prev.map(s => s.id === meta.id ? meta : s);
            saveSessionIndex(currentUser, updated);
            return updated;
        });
    }, [nodes, currentUser, hasLoaded, activeSessionId]);

    // Fetch models when user or provider changes
    useEffect(() => {
        if (currentUser) {
            const provider = PROVIDERS[selectedProvider];
            const apiKey = decodeApiKey(localStorage.getItem(apiKeyStorageKey(selectedProvider, currentUser)));
            fetchModels(provider, apiKey, currentUser).then(setModels);
        } else {
            setModels([]);
        }
    }, [currentUser, selectedProvider]);

    const addInitialNode = useCallback(() => {
        const centerX = (window.innerWidth - NODE_WIDTH) / 2;
        const centerY = (window.innerHeight - NODE_HEIGHT) / 2;

        const newNode: ChatNode = {
            id: generateId(),
            parentId: null,
            x: centerX,
            y: centerY,
            model: lastUsedModelRef.current,
            messages: [],
        };

        // If current session already has nodes, create a new session
        // If no session or current session is empty, add node in-place
        if (activeSessionId && nodes.length > 0) {
            // Create new session with the initial node
            const now = Date.now();
            const session: ChatSession = {
                id: generateId(),
                title: 'New Chat',
                nodes: [newNode],
                createdAt: now,
                updatedAt: now,
            };
            saveSessionData(currentUser, session);
            const { nodes: _, ...meta } = session;

            setSessions(prev => {
                const updated = [meta, ...prev].slice(0, MAX_SESSIONS);
                if (prev.length >= MAX_SESSIONS) {
                    const evicted = prev.slice(MAX_SESSIONS - 1);
                    evicted.forEach(s => deleteSessionData(currentUser, s.id));
                }
                saveSessionIndex(currentUser, updated);
                return updated;
            });
            setActiveSessionId(session.id);
            localStorage.setItem(activeSessionKey(currentUser), session.id);
            setNodes([newNode]);
        } else if (!activeSessionId) {
            // No session at all — create one
            const now = Date.now();
            const session: ChatSession = {
                id: generateId(),
                title: 'New Chat',
                nodes: [newNode],
                createdAt: now,
                updatedAt: now,
            };
            saveSessionData(currentUser, session);
            const { nodes: _, ...meta } = session;

            setSessions(prev => {
                const updated = [meta, ...prev].slice(0, MAX_SESSIONS);
                saveSessionIndex(currentUser, updated);
                return updated;
            });
            setActiveSessionId(session.id);
            localStorage.setItem(activeSessionKey(currentUser), session.id);
            setNodes([newNode]);
        } else {
            // Active session exists but is empty — just add the node
            setNodes([newNode]);
        }
    }, [activeSessionId, currentUser, nodes]);

    const createSession = useCallback(() => {
        if (!currentUser) return;

        const centerX = (window.innerWidth - NODE_WIDTH) / 2;
        const centerY = (window.innerHeight - NODE_HEIGHT) / 2;

        const initialNode: ChatNode = {
            id: generateId(),
            parentId: null,
            x: centerX,
            y: centerY,
            model: lastUsedModelRef.current,
            messages: [],
        };

        const now = Date.now();
        const session: ChatSession = {
            id: generateId(),
            title: 'New Chat',
            nodes: [initialNode],
            createdAt: now,
            updatedAt: now,
        };
        saveSessionData(currentUser, session);
        const { nodes: _, ...meta } = session;

        setSessions(prev => {
            const updated = [meta, ...prev].slice(0, MAX_SESSIONS);
            if (prev.length >= MAX_SESSIONS) {
                const evicted = prev.slice(MAX_SESSIONS - 1);
                evicted.forEach(s => deleteSessionData(currentUser, s.id));
            }
            saveSessionIndex(currentUser, updated);
            return updated;
        });

        setActiveSessionId(session.id);
        localStorage.setItem(activeSessionKey(currentUser), session.id);
        setNodes([initialNode]);
    }, [currentUser]);

    const loadSession = useCallback((id: string) => {
        if (!currentUser || id === activeSessionId) return;

        const data = loadSessionData(currentUser, id);
        if (data) {
            setNodes(data.nodes);
            setActiveSessionId(id);
            localStorage.setItem(activeSessionKey(currentUser), id);
        }
    }, [currentUser, activeSessionId]);

    const deleteSession = useCallback((id: string) => {
        if (!currentUser) return;

        deleteSessionData(currentUser, id);
        setSessions(prev => {
            const updated = prev.filter(s => s.id !== id);
            saveSessionIndex(currentUser, updated);

            // If we deleted the active session, switch to the next one
            if (id === activeSessionId) {
                const next = updated[0];
                if (next) {
                    const nextData = loadSessionData(currentUser, next.id);
                    setNodes(nextData?.nodes ?? []);
                    setActiveSessionId(next.id);
                    localStorage.setItem(activeSessionKey(currentUser), next.id);
                } else {
                    setNodes([]);
                    setActiveSessionId(null);
                    localStorage.removeItem(activeSessionKey(currentUser));
                }
            }

            return updated;
        });
    }, [currentUser, activeSessionId]);

    const handleBranch = (parentId: string, direction: 'right' | 'bottom' = 'right') => {
        setNodes(prevNodes => {
            if (prevNodes.length >= 10) {
                alert('Maximum of 10 nodes reached.');
                return prevNodes;
            }
            const parent = prevNodes.find(n => n.id === parentId);
            if (!parent) return prevNodes;

            const NODE_WIDTH = 576;
            const NODE_HEIGHT = 400;
            const GAP = 25;

            let newX: number, newY: number;

            if (direction === 'right') {
                newX = parent.x + NODE_WIDTH + 50;
                newY = parent.y + 100;
            } else {
                newX = parent.x + 50;
                newY = parent.y + NODE_HEIGHT + 50;
            }

            // Collision avoidance
            let collision = true;
            let attempts = 0;

            while (collision && attempts < 10) {
                collision = prevNodes.some(n =>
                    Math.abs(n.x - newX) < 100 &&
                    Math.abs(n.y - newY) < 100
                );

                if (collision) {
                    if (direction === 'right') {
                        newY += NODE_HEIGHT + GAP;
                    } else {
                        newX += NODE_WIDTH + 50;
                    }
                    attempts++;
                }
            }

            const newNode: ChatNode = {
                id: generateId(),
                parentId: parentId,
                x: newX,
                y: newY,
                model: parent.model,
                messages: [...parent.messages],
                startIndex: parent.messages.length,
            };
            return [...prevNodes, newNode];
        });
    };

    const handleSendMessage = async (nodeId: string, text: string) => {
        const provider = PROVIDERS[selectedProvider];
        const apiKey = decodeApiKey(localStorage.getItem(apiKeyStorageKey(selectedProvider, currentUser)));
        if (!apiKey) {
            alert(`Please set your ${provider.name} API Key in Settings first.`);
            setIsSettingsOpen(true);
            return;
        }

        const userMsg: Message = { role: 'user', content: text };
        const node = nodes.find(n => n.id === nodeId);
        const history = [...(node?.messages || []), userMsg];

        // Add user message + empty assistant placeholder for streaming
        setNodes(prev => prev.map(n =>
            n.id === nodeId
                ? { ...n, messages: [...n.messages, userMsg, { role: 'assistant' as const, content: '' }], isThinking: true }
                : n
        ));

        try {
            await chatCompletion(provider, apiKey, node?.model || provider.defaultModel.id, history, (accumulated) => {
                setNodes(prev => prev.map(n => {
                    if (n.id !== nodeId) return n;
                    const msgs = [...n.messages];
                    msgs[msgs.length - 1] = { role: 'assistant', content: accumulated };
                    return { ...n, messages: msgs };
                }));
            });
            setNodes(prev => prev.map(n =>
                n.id === nodeId ? { ...n, isThinking: false } : n
            ));
        } catch (error: any) {
            setNodes(prev => prev.map(n => {
                if (n.id !== nodeId) return n;
                const msgs = [...n.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant' && !last.content) msgs.pop();
                return { ...n, messages: msgs, isThinking: false };
            }));
            alert(`Error: ${error.message}`);
        }
    };

    const handleCompareMessage = async (nodeId: string, text: string, compareModels: string[]) => {
        const provider = PROVIDERS[selectedProvider];
        const apiKey = decodeApiKey(localStorage.getItem(apiKeyStorageKey(selectedProvider, currentUser)));
        if (!apiKey) {
            alert(`Please set your ${provider.name} API Key in Settings first.`);
            setIsSettingsOpen(true);
            return;
        }

        const count = compareModels.length;
        if (nodes.length + count > 10) {
            alert('Not enough room — maximum of 10 nodes reached.');
            return;
        }

        const userMsg: Message = { role: 'user', content: text };
        const parent = nodes.find(n => n.id === nodeId);
        if (!parent) return;

        const history = [...parent.messages, userMsg];
        const parentW = parent.width || NODE_WIDTH;
        const parentH = parent.height || NODE_HEIGHT;
        const GAP = 25;

        // Position children side-by-side below the parent, centered
        const childIds = compareModels.map(() => generateId());
        const childWidth = count >= 3 ? 480 : NODE_WIDTH;
        const totalWidth = count * childWidth + (count - 1) * GAP;
        const startX = parent.x + parentW / 2 - totalWidth / 2;

        // Include empty assistant placeholder in each child for streaming
        const children: ChatNode[] = compareModels.map((model, i) => ({
            id: childIds[i],
            parentId: nodeId,
            x: startX + i * (childWidth + GAP),
            y: parent.y + parentH + 50,
            width: childWidth,
            model,
            messages: [...history, { role: 'assistant' as const, content: '' }],
            startIndex: history.length - 1,
            isThinking: true,
        }));

        // Add user message to parent + create all children
        setNodes(prev => [
            ...prev.map(n => n.id === nodeId ? { ...n, messages: [...n.messages, userMsg] } : n),
            ...children,
        ]);

        // Fire all API requests simultaneously with streaming
        const requests = compareModels.map(async (model, i) => {
            try {
                await chatCompletion(provider, apiKey, model, history, (accumulated) => {
                    setNodes(prev => prev.map(n => {
                        if (n.id !== childIds[i]) return n;
                        const msgs = [...n.messages];
                        msgs[msgs.length - 1] = { role: 'assistant', content: accumulated };
                        return { ...n, messages: msgs };
                    }));
                });
                setNodes(prev => prev.map(n =>
                    n.id === childIds[i] ? { ...n, isThinking: false } : n
                ));
            } catch (error: any) {
                setNodes(prev => prev.map(n => {
                    if (n.id !== childIds[i]) return n;
                    const msgs = [...n.messages];
                    msgs[msgs.length - 1] = { role: 'assistant', content: `Error: ${error.message}` };
                    return { ...n, messages: msgs, isThinking: false };
                }));
            }
        });

        await Promise.allSettled(requests);
    };

    const handleMergeDuel = async (parentId: string) => {
        const provider = PROVIDERS[selectedProvider];
        const apiKey = decodeApiKey(localStorage.getItem(apiKeyStorageKey(selectedProvider, currentUser)));
        if (!apiKey) {
            alert(`Please set your ${provider.name} API Key in Settings first.`);
            setIsSettingsOpen(true);
            return;
        }

        const parent = nodes.find(n => n.id === parentId);
        if (!parent) return;

        const children = nodes.filter(n => n.parentId === parentId);
        if (children.length < 2) return;

        // Check if all children have at least one assistant response
        const childResponses = children.map(child => {
            const lastAssistant = [...child.messages].reverse().find(m => m.role === 'assistant');
            return { model: child.model, response: lastAssistant?.content };
        }).filter(c => c.response);

        if (childResponses.length < 2) {
            alert('Wait for at least 2 models to respond before merging.');
            return;
        }

        if (nodes.length + 1 > 10) {
            alert('Not enough room — maximum of 10 nodes reached.');
            return;
        }

        // Build the merge prompt
        const summaryPrompt = childResponses.map((c, i) =>
            `**Model ${i + 1} (${c.model}):**\n${c.response}`
        ).join('\n\n---\n\n');

        const userContent = `Compare and summarize the following responses from ${childResponses.length} different models to the question: "${parent.messages[parent.messages.length - 1]?.content || 'the conversation'}"\n\n${summaryPrompt}\n\nProvide a concise comparison highlighting key differences, agreements, and which response is most helpful or accurate.`;

        const mergeId = generateId();

        // Position merge node centered below all children
        const minX = Math.min(...children.map(c => c.x));
        const maxX = Math.max(...children.map(c => c.x + (c.width || NODE_WIDTH)));
        const maxY = Math.max(...children.map(c => c.y + (c.height || NODE_HEIGHT)));
        const mergeX = (minX + maxX) / 2 - NODE_WIDTH / 2;
        const mergeY = maxY + 50;

        const mergeNode: ChatNode = {
            id: mergeId,
            parentId: children[0].id,
            mergeParentIds: children.map(c => c.id),
            x: mergeX,
            y: mergeY,
            model: parent.model,
            messages: [
                { role: 'user', content: userContent },
                { role: 'assistant', content: '' },
            ],
            startIndex: 0,
            isThinking: true,
        };

        setNodes(prev => [...prev, mergeNode]);

        try {
            await chatCompletion(provider, apiKey, parent.model, [{ role: 'user', content: userContent }], (accumulated) => {
                setNodes(prev => prev.map(n => {
                    if (n.id !== mergeId) return n;
                    const msgs = [...n.messages];
                    msgs[msgs.length - 1] = { role: 'assistant', content: accumulated };
                    return { ...n, messages: msgs };
                }));
            });
            setNodes(prev => prev.map(n =>
                n.id === mergeId ? { ...n, isThinking: false } : n
            ));
        } catch (error: any) {
            setNodes(prev => prev.map(n => {
                if (n.id !== mergeId) return n;
                const msgs = [...n.messages];
                msgs[msgs.length - 1] = { role: 'assistant', content: `Error: ${error.message}` };
                return { ...n, messages: msgs, isThinking: false };
            }));
        }
    };

    const clearData = (setView: (view: ViewState) => void) => {
        if (window.confirm('Are you sure you want to clear all data and reset the canvas?')) {
            // Clear all canvas sessions (auth is managed by Better-Auth)
            sessions.forEach(s => deleteSessionData(currentUser, s.id));
            localStorage.removeItem(sessionIndexKey(currentUser));
            localStorage.removeItem(activeSessionKey(currentUser));
            localStorage.removeItem(legacyNodesKey(currentUser));
            localStorage.removeItem('canvasNodes');
            setNodes([]);
            setSessions([]);
            setActiveSessionId(null);
            setView('landing');
        }
    };

    const refreshModels = () => {
        if (currentUser) {
            const provider = PROVIDERS[selectedProvider];
            const apiKey = decodeApiKey(localStorage.getItem(apiKeyStorageKey(selectedProvider, currentUser)));
            fetchModels(provider, apiKey, currentUser).then(setModels);
        }
    };

    const updateNodeSize = (id: string, width: number, height: number) => {
        setNodes(prev => prev.map(n =>
            n.id === id ? { ...n, width, height } : n
        ));
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
        handleCompareMessage,
        handleMergeDuel,
        clearData,
        hasLoaded,
        refreshModels,
        updateNodeSize,
        sessions,
        activeSessionId,
        createSession,
        loadSession,
        deleteSession,
        selectedProvider,
        setSelectedProvider,
    };
};
