
// Update to use Gemini SDK and follow guidelines
import { GoogleGenAI } from "@google/genai";
import { Message, OpenRouterModel } from '../types';

/**
 * Returns a list of Gemini models following the official naming guidelines.
 * This replaces the OpenRouter model fetching logic.
 */
export const fetchModels = async (): Promise<OpenRouterModel[]> => {
  return [
    {
      id: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash',
      context_length: 1000000,
      pricing: { prompt: '0', completion: '0' }
    },
    {
      id: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro',
      context_length: 2000000,
      pricing: { prompt: '0', completion: '0' }
    },
    {
      id: 'gemini-flash-lite-latest',
      name: 'Gemini Flash Lite',
      context_length: 1000000,
      pricing: { prompt: '0', completion: '0' }
    },
    {
      id: 'gemini-2.5-flash-image',
      name: 'Gemini 2.5 Flash Image',
      context_length: 0,
      pricing: { prompt: '0', completion: '0' }
    }
  ];
};

/**
 * Handles chat completions using the @google/genai SDK.
 * Always initializes with process.env.API_KEY as per guidelines.
 */
export const chatCompletion = async (
  model: string,
  messages: Message[]
): Promise<string> => {
  // Initialization must use the named parameter and process.env.API_KEY exclusively.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Separate system instruction from conversation history
  const systemMsg = messages.find(m => m.role === 'system');
  const otherMsgs = messages.filter(m => m.role !== 'system');

  // Map roles to Gemini roles ('user' or 'model')
  const contents = otherMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: systemMsg ? {
        systemInstruction: systemMsg.content,
      } : undefined,
    });

    // Access the .text property directly as per the Extraction guidelines
    return response.text || '';
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Failed to generate content from Gemini');
  }
};
