
import { GoogleGenAI, Chat, Content, GenerationConfig, SafetySetting } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface CreateChatParams {
  history?: Content[];
  model?: string;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
  systemInstruction?: string;
  useGoogleSearch?: boolean;
  useUrlContext?: boolean;
  useCodeExecution?: boolean;
  thinkingMode?: boolean;
  setThinkingBudget?: boolean;
  thinkingBudget?: number;
}

export const createChat = (params: CreateChatParams): Chat => {
  const tools: any[] = [];
  if (params.useGoogleSearch) {
    tools.push({ googleSearch: {} });
  }
  if (params.useUrlContext) {
    tools.push({ urlContext: {} });
  }
  if (params.useCodeExecution) {
    tools.push({ codeExecution: {} });
  }

  // Build the full configuration object for the chat session.
  const config: any = {
    ...params.generationConfig,
    safetySettings: params.safetySettings,
    systemInstruction: params.systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
  };

  // Conditionally add thinking configuration only for the specific model that supports it.
  if (params.model === 'gemini-2.5-flash') {
    let budget;
    if (params.thinkingMode === false) {
      budget = 0; // Thinking mode is off
    } else if (params.setThinkingBudget === false) {
      budget = -1; // Dynamic thinking
    } else {
      budget = params.thinkingBudget; // User-defined budget
    }
    config.thinkingConfig = { thinkingBudget: budget };
  }

  return ai.chats.create({
    model: params.model || 'gemini-2.5-flash',
    history: params.history || [],
    config: config, // Pass the fully constructed config object
  });
};
