
import { GoogleGenAI } from "@google/genai";
import { Message, OpenRouterModel } from '../types';

/**
 * Returns available Gemini models for selection in the UI.
 */
export const fetchModels = async (_apiKey: string): Promise<OpenRouterModel[]> => {
  // Static list of recommended Gemini models as per guidelines
  return [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', context_length: 1000000, pricing: { prompt: '0', completion: '0' } },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', context_length: 2000000, pricing: { prompt: '0', completion: '0' } },
    { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini Flash Lite', context_length: 1000000, pricing: { prompt: '0', completion: '0' } },
  ];
};

/**
 * Handles chat completions using the @google/genai library.
 */
export const chatCompletion = async (
  _apiKey: string, // Ignored, using process.env.API_KEY per guidelines
  modelId: string,
  messages: Message[]
): Promise<string> => {
  // Initialize AI with the environment variable API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Separate system instruction and convert messages to Gemini format
  const systemInstruction = messages.find(m => m.role === 'system')?.content;
  const conversation = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  // Call generateContent with the specified model and formatted contents
  const response = await ai.models.generateContent({
    model: modelId || 'gemini-3-flash-preview',
    contents: conversation,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  // Extract text from response using the .text property
  return response.text || '';
};
