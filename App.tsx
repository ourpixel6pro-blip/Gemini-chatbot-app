
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat, Part } from '@google/genai';
import { Message } from './types';
import { initializeChat } from './services/geminiService';
import Header from './components/Header';
import ChatLog from './components/ChatLog';
import ChatInput from './components/ChatInput';
import WelcomeScreen from './components/WelcomeScreen';
import Footer from './components/Footer';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const chatRef = useRef<Chat | null>(null);
    const chatLogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatRef.current = initializeChat();
    }, []);
    
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
    
    const sendMessage = useCallback(async (userInput: string, attachmentFiles: File[]) => {
        if (isLoading || (!userInput.trim() && attachmentFiles.length === 0)) return;

        setIsLoading(true);

        const userMessage: Message = { role: 'user', content: userInput, attachments: [] };
        const modelMessagePlaceholder: Message = { role: 'model', content: '' };

        const parts: Part[] = [];

        if (attachmentFiles.length > 0) {
            for (const file of attachmentFiles) {
                try {
                    const isTextFile = file.type.startsWith('text/') || 
                                       file.type === 'application/json' || 
                                       file.type === 'application/xml' ||
                                       file.type.endsWith('+xml');
                    
                    if (file.type.startsWith('image/')) {
                        const base64Data = await fileToBase64(file);
                        parts.push({
                            inlineData: {
                                mimeType: file.type,
                                data: base64Data,
                            },
                        });
                        userMessage.attachments!.push({
                            file: file,
                            previewUrl: URL.createObjectURL(file)
                        });
                    } else if (isTextFile && file.size < 2 * 1024 * 1024) { // 2MB limit for text files
                        const textContent = await fileToText(file);
                        const fileContext = `\n\nThe following is the content of the attached file "${file.name}":\n\n\`\`\`\n${textContent}\n\`\`\`\n`;
                        parts.push({ text: fileContext });
                        userMessage.attachments!.push({ file });
                    } else {
                        // Handle unsupported or large files gracefully
                        alert(`File type not supported or file too large: ${file.name}`);
                        setIsLoading(false);
                        return; // Stop the process
                    }
                } catch (error) {
                    console.error("Failed to process attachment:", error);
                    alert(`Error processing file: ${file.name}`);
                    setIsLoading(false);
                    return;
                }
            }
        }
        
        if (userInput.trim()) {
            parts.push({ text: userInput });
        }
        
        setMessages(prev => [...prev, userMessage, modelMessagePlaceholder]);

        try {
            if (!chatRef.current) {
                throw new Error("Chat not initialized");
            }
            
            // FIX: The sendMessageStream method expects an object with a 'message' property.
            const stream = await chatRef.current.sendMessageStream({ message: parts });

            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', content: fullResponse };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                     newMessages[newMessages.length - 1] = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
                } else {
                    newMessages.push({ role: 'model', content: 'Sorry, I encountered an error. Please try again.' });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);


    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
            <Header theme={theme} onToggleTheme={toggleTheme} />
            <main className="flex-grow flex flex-col items-center w-full overflow-y-auto">
                <div className="w-full max-w-4xl flex-grow flex flex-col px-4 pt-4">
                    {messages.length === 0 ? (
                        <WelcomeScreen />
                    ) : (
                        <ChatLog ref={chatLogRef} messages={messages} isLoading={isLoading} />
                    )}
                </div>
                 <div className="w-full sticky bottom-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-gray-900 dark:via-gray-900 pt-4 pb-6 flex justify-center">
                    <div className="w-full max-w-4xl px-4 flex flex-col items-center">
                        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
                        <Footer />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;