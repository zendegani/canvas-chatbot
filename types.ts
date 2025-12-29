
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
}

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export type ViewState = 'landing' | 'login' | 'signup' | 'canvas';
