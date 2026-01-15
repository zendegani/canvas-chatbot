import { Message, OpenRouterModel } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

/**
 * Returns available models from OpenRouter.
 */
export const fetchModels = async (apiKey: string): Promise<OpenRouterModel[]> => {
  if (!apiKey) {
    // Return a default list if no API key is provided, or throw error depending on UX choice
    // For now, let's return a sensible default list so the UI doesn't break
    return [
      {
        id: 'google/gemini-pro',
        name: 'Google: Gemini Pro',
        context_length: 32000,
        pricing: { prompt: '0.00025', completion: '0.0005' }
      },
      {
        id: 'openai/gpt-3.5-turbo',
        name: 'OpenAI: GPT-3.5 Turbo',
        context_length: 16385,
        pricing: { prompt: '0.0005', completion: '0.0015' }
      },
      {
        id: 'mistralai/mistral-7b-instruct',
        name: 'Mistral: Mistral 7B Instruct',
        context_length: 32768,
        pricing: { prompt: '0', completion: '0' }
      }
    ];
  }

  try {
    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error(`OpenRouter API Error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching models:', error);
    // Fallback to a static list if fetch fails, so the app remains usable
    return [
      {
        id: 'google/gemini-pro',
        name: 'Google: Gemini Pro (Fallback)',
        context_length: 32000,
        pricing: { prompt: '0.00025', completion: '0.0005' }
      },
      {
        id: 'openai/gpt-3.5-turbo',
        name: 'OpenAI: GPT-3.5 Turbo (Fallback)',
        context_length: 16385,
        pricing: { prompt: '0.0005', completion: '0.0015' }
      },
    ];
  }
};

/**
 * Handles chat completions using OpenRouter API.
 */
export const chatCompletion = async (
  apiKey: string,
  modelId: string,
  messages: Message[]
): Promise<string> => {
  if (!apiKey) {
    throw new Error('API Key is missing. Please add your OpenRouter API Key in settings.');
  }

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': `${window.location.origin}`, // Required by OpenRouter
      'X-Title': 'Canvas AI', // Optional
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};
