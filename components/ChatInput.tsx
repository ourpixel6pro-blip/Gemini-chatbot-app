import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { AttachIcon, SendIcon, CloseIcon, FileIcon } from './icons/Icons';

interface AttachmentWithPreview {
    file: File;
    previewUrl?: string;
}

interface ChatInputProps {
    onSendMessage: (message: string, attachments: File[]) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<AttachmentWithPreview[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Cleanup function for object URLs
        return () => {
            attachments.forEach(att => {
                if (att.previewUrl) {
                    URL.revokeObjectURL(att.previewUrl);
                }
            });
        };
    }, [attachments]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const handleSend = () => {
        if ((input.trim() || attachments.length > 0) && !isLoading) {
            onSendMessage(input, attachments.map(a => a.file));
            setInput('');
            setAttachments([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newAttachments: AttachmentWithPreview[] = Array.from(files).map(file => ({
                file,
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
            }));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        const attachmentToRemove = attachments[indexToRemove];
        if (attachmentToRemove?.previewUrl) {
            URL.revokeObjectURL(attachmentToRemove.previewUrl);
        }
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    return (
        <div className="w-full">
            <div className="relative bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col transition-shadow focus-within:shadow-md">
                {attachments.length > 0 && (
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-3 overflow-x-auto pb-2">
                            {attachments.map((att, index) => (
                                <div key={index} className="relative flex-shrink-0 group">
                                    {att.previewUrl ? (
                                        <img src={att.previewUrl} alt="Attachment preview" className="h-24 w-24 object-cover rounded-md border border-gray-200 dark:border-gray-600" />
                                    ) : (
                                        <div className="flex flex-col justify-center items-center space-y-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-md h-24 w-32 border border-gray-200 dark:border-gray-600">
                                            <FileIcon />
                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate w-full text-center" title={att.file.name}>{att.file.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(att.file.size)}</p>
                                        </div>
                                    )}
                                    <button onClick={() => removeAttachment(index)} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5 hover:bg-black dark:bg-gray-200 dark:text-black dark:hover:bg-white transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow-md">
                                        <CloseIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex items-end p-2">
                    <button 
                        onClick={handleAttachClick}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mr-2 self-center">
                        <AttachIcon />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything"
                        className="flex-grow bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none resize-none text-base self-center"
                        rows={1}
                        style={{ maxHeight: '200px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && attachments.length === 0)}
                        className="ml-2 bg-gray-800 dark:bg-gray-200 hover:bg-gray-700 dark:hover:bg-gray-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full p-2.5 transition-colors self-center flex-shrink-0"
                    >
                       <SendIcon />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                </div>
            </div>
        </div>
    );
};

export default ChatInput;