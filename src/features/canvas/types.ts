export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatNode {
    id: string;
    parentId: string | null;
    x: number;
    y: number;
    model: string;
    messages: Message[];
    isThinking?: boolean;
    startIndex?: number; // Index in messages array where this branch's own messages start
    width?: number;
    height?: number;
    userResized?: boolean;
    mergeParentIds?: string[]; // IDs of nodes that merge into this node (for duel summaries)
}

export interface ChatSession {
    id: string;
    title: string;
    nodes: ChatNode[];
    createdAt: number;
    updatedAt: number;
}

export type ProviderId = 'openrouter' | 'openai' | 'google';

export interface ProviderConfig {
    id: ProviderId;
    name: string;
    baseUrl: string;
    keyPlaceholder: string;
    defaultModel: LLMModel;
}

export interface LLMModel {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
        prompt: string;
        completion: string;
    };
}
