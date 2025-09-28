

import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { AttachIcon, SendIcon, CloseIcon, FileIcon, StopIcon, SpinnerIcon } from './icons/Icons';
import { ProcessedAttachment } from '../types';

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

interface AttachmentState extends ProcessedAttachment {}

interface ChatInputProps {
    onSendMessage: (message: string, attachments: ProcessedAttachment[]) => void;
    isLoading: boolean;
    onStopStream: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, onStopStream }) => {
    const [userInput, setUserInput] = useState('');
    const [attachments, setAttachments] = useState<AttachmentState[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isProcessingFiles = attachments.some(att => att.status === 'processing');
    const canSendMessage = !isLoading && !isProcessingFiles && (userInput.trim() !== '' || attachments.length > 0);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            attachments.forEach(att => {
                if (att.previewUrl) {
                    URL.revokeObjectURL(att.previewUrl);
                }
            });
        };
    }, [attachments]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);

        const newAttachments: AttachmentState[] = newFiles.map(file => ({
            file,
            status: 'processing',
            data: null,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }));
        
        setAttachments(prev => [...prev, ...newAttachments]);

        newAttachments.forEach(att => {
            const isTextFile = att.file.type.startsWith('text/') || 
                               att.file.type === 'application/json' ||
                               att.file.type === 'application/pdf' || // Process PDF as base64
                               att.file.type === 'application/xml' ||
                               att.file.type.endsWith('+xml');
            
            const promise = isTextFile && att.file.type !== 'application/pdf'
                ? fileToText(att.file)
                : fileToBase64(att.file);

            promise.then(data => {
                setAttachments(prev => {
                    const updated = [...prev];
                    const targetIndex = updated.findIndex(a => a.file === att.file);
                    if (targetIndex !== -1) {
                        updated[targetIndex] = { ...updated[targetIndex], status: 'ready', data };
                    }
                    return updated;
                });
            }).catch(error => {
                console.error("Failed to process file:", error);
                setAttachments(prev => {
                    const updated = [...prev];
                    const targetIndex = updated.findIndex(a => a.file === att.file);
                    if (targetIndex !== -1) {
                        updated[targetIndex] = { ...updated[targetIndex], status: 'error', error: 'Failed to read file.' };
                    }
                    return updated;
                });
            });
        });
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (fileToRemove: File) => {
        setAttachments(prev => prev.filter(att => att.file !== fileToRemove));
    };

    const handleSend = () => {
        if (!canSendMessage) return;
        
        const readyAttachments = attachments.filter((att): att is AttachmentState & { status: 'ready' } => att.status === 'ready');
        onSendMessage(userInput, readyAttachments);
        setUserInput('');
        setAttachments([]);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    return (
        <div className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm transition-colors duration-300">
            {attachments.length > 0 && (
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {attachments.map((att, index) => (
                            <div key={index} className="relative group w-full aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                                {att.previewUrl ? (
                                    <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-2">
                                        <FileIcon />
                                        <p className="text-xs text-center mt-2 text-slate-600 dark:text-slate-300 truncate" title={att.file.name}>{att.file.name}</p>
                                        <p className="text-xxs text-slate-500">{formatFileSize(att.file.size)}</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(att.file)}
                                    className="absolute top-1 right-1 bg-slate-800/50 hover:bg-slate-800/80 text-white rounded-full p-0.5 transition-colors"
                                >
                                    <CloseIcon />
                                </button>
                                {att.status === 'processing' && (
                                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <SpinnerIcon />
                                    </div>
                                )}
                                {att.status === 'error' && (
                                     <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white text-xs text-center p-2">
                                        Error
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex items-start p-3">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 mr-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    aria-label="Attach files"
                >
                    <AttachIcon />
                </button>
                <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything"
                    className="flex-grow w-full bg-transparent resize-none border-0 focus:ring-0 p-0 text-base leading-6 placeholder-slate-500 dark:placeholder-slate-400 max-h-48"
                    rows={1}
                />
                <button
                    onClick={isLoading ? onStopStream : handleSend}
                    disabled={!isLoading && !canSendMessage}
                    className="ml-2 self-end flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-blue-600 text-white enabled:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={isLoading ? "Stop generating" : "Send message"}
                >
                    {isLoading ? <StopIcon /> : <SendIcon />}
                </button>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
};

export default ChatInput;