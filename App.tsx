

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Content, Part, GenerationConfig, SafetySetting, HarmCategory, HarmBlockThreshold, GroundingMetadata } from '@google/genai';
import { Message, ChatSettings, DisplayPart, ProcessedAttachment } from './types';
import { createChat } from './services/geminiService';
import Header from './components/Header';
import ChatLog from './components/ChatLog';
import ChatInput from './components/ChatInput';
import WelcomeScreen from './components/WelcomeScreen';
import Footer from './components/Footer';
import SettingsSidebar from './components/SettingsSidebar';


const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<ChatSettings>({
        model: 'gemini-2.5-flash',
        systemInstruction: 'You are a helpful and friendly assistant. Format your responses using markdown.',
        temperature: 1,
        topP: 0.95,
        maxOutputTokens: 8192,
        stopSequences: [],
        mediaResolution: 'Default',
        thinkingMode: true,
        setThinkingBudget: false,
        thinkingBudget: 8000,
        useGoogleSearch: false,
        useUrlContext: false,
        useCodeExecution: false,
        safetySettings: {
            [HarmCategory.HARM_CATEGORY_HARASSMENT]: HarmBlockThreshold.BLOCK_NONE,
            [HarmCategory.HARM_CATEGORY_HATE_SPEECH]: HarmBlockThreshold.BLOCK_NONE,
            [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]: HarmBlockThreshold.BLOCK_NONE,
            [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]: HarmBlockThreshold.BLOCK_NONE,
        },
    });

    const chatLogRef = useRef<HTMLDivElement>(null);
    const stopStream = useRef(false);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);

        const darkTheme = document.getElementById('hljs-dark-theme') as HTMLLinkElement;
        const lightTheme = document.getElementById('hljs-light-theme') as HTMLLinkElement;

        if (darkTheme && lightTheme) {
            darkTheme.disabled = theme !== 'dark';
            lightTheme.disabled = theme !== 'light';
        }
    }, [theme]);

    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [messages]);
    
    // Helper to convert raw API parts to a display-friendly format
    const convertToDisplayParts = (parts: Part[]): DisplayPart[] => {
        const displayParts: DisplayPart[] = [];
        for (const part of parts) {
            if (part.text) {
                displayParts.push({ type: 'text', content: part.text });
            } else if ((part as any).executableCode) {
                 displayParts.push({ type: 'executableCode', content: (part as any).executableCode.code });
            } else if ((part as any).codeExecutionResult) {
                 displayParts.push({ type: 'codeExecutionResult', content: (part as any).codeExecutionResult.output });
            }
        }
        return displayParts;
    };

    const sendMessage = useCallback(async (userInput: string, attachments: ProcessedAttachment[]) => {
        if (isLoading || (!userInput.trim() && attachments.length === 0)) return;

        setIsLoading(true);
        stopStream.current = false;

        const userMessageParts: Part[] = [];
        const userMessageAttachments: { file: File }[] = [];

        if (attachments.length > 0) {
            for (const att of attachments) {
                const { file, data } = att;
                 const isTextFile = file.type.startsWith('text/') || 
                                   file.type === 'application/json' || 
                                   file.type === 'application/xml' ||
                                   file.type.endsWith('+xml');
                
                if (isTextFile) {
                    const fileContext = `\n\nThe following is the content of the attached file "${file.name}":\n\n\`\`\`\n${data}\n\`\`\`\n`;
                    userMessageParts.push({ text: fileContext });
                } else { // Image or PDF
                    userMessageParts.push({
                        inlineData: {
                            mimeType: file.type,
                            data: data!,
                        },
                    });
                }
                userMessageAttachments.push({ file });
            }
        }
        
        if (userInput.trim()) {
            userMessageParts.push({ text: userInput });
        }
        
        const userMessage: Message = { 
            role: 'user', 
            displayParts: userInput.trim() ? [{ type: 'text', content: userInput }] : [],
            parts: userMessageParts,
            attachments: userMessageAttachments.map(att => ({
                file: att.file,
                previewUrl: att.file.type.startsWith('image/') ? URL.createObjectURL(att.file) : undefined
            })),
        };
        const modelMessagePlaceholder: Message = { role: 'model', displayParts: [], parts: [] };

        const history: Content[] = messages.map(msg => ({
            role: msg.role,
            parts: msg.parts,
        }));
        
        setMessages(prev => [...prev, userMessage, modelMessagePlaceholder]);

        try {
            const generationConfig: GenerationConfig = {
                temperature: settings.temperature,
                topP: settings.topP,
                maxOutputTokens: settings.maxOutputTokens,
                stopSequences: settings.stopSequences.length > 0 ? settings.stopSequences : undefined,
            };

            const safetySettingsForApi: SafetySetting[] = Object.entries(settings.safetySettings).map(([category, threshold]) => ({
                category: category as HarmCategory,
                threshold,
            }));

            const chat = createChat({
                history,
                model: settings.model,
                generationConfig,
                safetySettings: safetySettingsForApi,
                systemInstruction: settings.systemInstruction,
                useGoogleSearch: settings.useGoogleSearch,
                useUrlContext: settings.useUrlContext,
                useCodeExecution: settings.useCodeExecution,
                thinkingMode: settings.thinkingMode,
                setThinkingBudget: settings.setThinkingBudget,
                thinkingBudget: settings.thinkingBudget,
            });

            const stream = await chat.sendMessageStream({ message: userMessageParts });
            
            let accumulatedParts: Part[] = [];
            let finalGroundingMetadata: GroundingMetadata | undefined = undefined;

            for await (const chunk of stream) {
                if (stopStream.current) {
                    setIsLoading(false); // Instantly update UI on stop
                    break;
                }

                if (chunk.candidates?.[0]?.content?.parts) {
                    // This logic merges streaming text parts together.
                    chunk.candidates[0].content.parts.forEach(part => {
                        const lastPart = accumulatedParts[accumulatedParts.length - 1];
                        if (part.text && lastPart && lastPart.text) {
                            lastPart.text += part.text;
                        } else {
                            accumulatedParts.push(part);
                        }
                    });
                }
                
                if (chunk.candidates?.[0]?.groundingMetadata) {
                    finalGroundingMetadata = chunk.candidates[0].groundingMetadata;
                }
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessageIndex = newMessages.length - 1;
                    newMessages[lastMessageIndex] = {
                        role: 'model',
                        parts: [...accumulatedParts],
                        displayParts: convertToDisplayParts(accumulatedParts),
                        groundingMetadata: finalGroundingMetadata,
                    };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = `Sorry, I encountered an error. ${error instanceof Error ? error.message : String(error)}`;
            const errorDisplayPart: DisplayPart = { type: 'text', content: errorMessage };
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                     newMessages[newMessages.length - 1] = { 
                         role: 'model', 
                         displayParts: [errorDisplayPart],
                         parts: [{ text: errorMessage }]
                    };
                } else {
                    newMessages.push({ 
                        role: 'model', 
                        displayParts: [errorDisplayPart],
                        parts: [{ text: errorMessage }]
                    });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
            stopStream.current = false;
        }
    }, [isLoading, messages, settings]);


    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };
    
    const handleStopStream = () => {
        stopStream.current = true;
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
            <SettingsSidebar 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />
            <Header 
                theme={theme} 
                onToggleTheme={toggleTheme} 
                onToggleSettings={() => setIsSettingsOpen(true)}
            />
            <main className="flex-grow flex flex-col items-center w-full overflow-y-auto">
                <div className="w-full max-w-4xl flex-grow flex flex-col px-4 pt-4">
                    {messages.length === 0 ? (
                        <WelcomeScreen />
                    ) : (
                        <ChatLog ref={chatLogRef} messages={messages} isLoading={isLoading} />
                    )}
                </div>
                 <div className="w-full sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-900 dark:via-slate-900 pt-4 pb-6 flex justify-center">
                    <div className="w-full max-w-4xl px-4 flex flex-col items-center">
                        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} onStopStream={handleStopStream} />
                        <Footer />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;