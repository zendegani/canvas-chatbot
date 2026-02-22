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
}

export interface ChatSession {
    id: string;
    title: string;
    nodes: ChatNode[];
    createdAt: number;
    updatedAt: number;
}

export interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length: number;
    pricing: {
        prompt: string;
        completion: string;
    };
}
