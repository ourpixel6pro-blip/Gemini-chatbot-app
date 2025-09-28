

import { Part, HarmCategory, HarmBlockThreshold, GroundingMetadata } from '@google/genai';

export interface DisplayPart {
  type: 'text' | 'executableCode' | 'codeExecutionResult';
  content: string;
}

export interface ProcessedAttachment {
    file: File;
    status: 'processing' | 'ready' | 'error';
    data: string | null;
    previewUrl?: string; // object URL for images
    error?: string;
}

export interface Message {
    role: 'user' | 'model';
    displayParts: DisplayPart[];
    parts: Part[];
    attachments?: Array<{
        file: File;
        previewUrl?: string;
    }>;
    groundingMetadata?: GroundingMetadata;
}

export type SafetySettings = Partial<Record<HarmCategory, HarmBlockThreshold>>;

export interface ChatSettings {
    model: string;
    systemInstruction: string;
    temperature: number;
    topP: number;
    maxOutputTokens: number;
    stopSequences: string[];
    mediaResolution: 'Default' | 'Low' | 'Medium';
    thinkingMode: boolean;
    setThinkingBudget: boolean;
    thinkingBudget: number;
    useGoogleSearch: boolean;
    useUrlContext: boolean;
    useCodeExecution: boolean;
    safetySettings: SafetySettings;
}