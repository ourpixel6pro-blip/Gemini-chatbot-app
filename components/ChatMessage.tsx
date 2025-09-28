import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { UserIcon, GeminiIcon, FileIcon } from './icons/Icons';

interface ChatMessageProps {
    message: Message;
    isLastMessage: boolean;
    isLoading: boolean;
}

declare global {
    interface Window {
        marked: any;
        hljs: any;
    }
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current && window.marked) {
            const parsedHtml = window.marked.parse(content);
            contentRef.current.innerHTML = parsedHtml;
            
            contentRef.current.querySelectorAll('pre').forEach((pre) => {
                if (pre.querySelector('.copy-btn-container')) return; // Don't add button if it exists

                const wrapper = document.createElement('div');
                wrapper.className = 'relative group';

                const copyButtonContainer = document.createElement('div');
                copyButtonContainer.className = 'copy-btn-container absolute top-2 right-2';
                const copyButton = document.createElement('button');
                copyButton.className = 'p-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity';
                copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zM8 2h.5a.5.5 0 0 0-.5-.5H8v.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V2h.5a.5.5 0 0 0 .5-.5V.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 .5.5H8z"/></svg>`;

                copyButton.onclick = () => {
                    const code = pre.querySelector('code')?.innerText;
                    if (code) {
                        navigator.clipboard.writeText(code).then(() => {
                            copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-green-500" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg>`;
                            setTimeout(() => {
                                copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zM8 2h.5a.5.5 0 0 0-.5-.5H8v.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V2h.5a.5.5 0 0 0 .5-.5V.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v1.5a.5.5 0 0 0 .5.5H8z"/></svg>`;
                            }, 2000);
                        });
                    }
                };

                copyButtonContainer.appendChild(copyButton);
                pre.parentNode?.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);
                wrapper.appendChild(copyButtonContainer);
            });
            
            contentRef.current.querySelectorAll('pre code').forEach((block) => {
                window.hljs.highlightElement(block as HTMLElement);
            });
        }
    }, [content]);

    return <div ref={contentRef} className="prose dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3" />;
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLastMessage, isLoading }) => {
    const isModel = message.role === 'model';

    useEffect(() => {
        // Clean up the object URLs to prevent memory leaks
        return () => {
            if (message.attachments) {
                message.attachments.forEach(att => {
                    if (att.previewUrl) {
                        URL.revokeObjectURL(att.previewUrl);
                    }
                });
            }
        };
    }, [message.attachments]);
    
    const loadingCursor = isLastMessage && isLoading && isModel && message.content.length > 0
        ? '<span class="animate-pulse">▍</span>'
        : '';
    const loadingDots = isLastMessage && isLoading && isModel && message.content.length === 0
        ? `<div class="flex items-center space-x-1">
             <div class="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
             <div class="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
             <div class="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
           </div>`
        : null;

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    return (
        <div className="flex items-start space-x-4 py-4">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-indigo-500' : 'bg-gray-500 dark:bg-gray-600'}`}>
                {isModel ? <GeminiIcon /> : <UserIcon />}
            </div>
            <div className="flex-grow pt-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white mb-2">{isModel ? 'ChatGPT' : 'You'}</p>
                 {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {message.attachments.map((att, index) => (
                             <div key={index}>
                                {att.previewUrl ? (
                                     <img src={att.previewUrl} alt="User attachment" className="w-full h-auto object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                                ) : (
                                    <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
                                        <FileIcon />
                                        <div className="text-sm overflow-hidden">
                                            <p className="font-medium text-gray-800 dark:text-gray-200 truncate" title={att.file.name}>{att.file.name}</p>
                                            <p className="text-gray-500 dark:text-gray-400">{formatFileSize(att.file.size)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {isModel ? (
                        <>
                           {loadingDots ? 
                                <div dangerouslySetInnerHTML={{ __html: loadingDots }} /> :
                                <MarkdownRenderer content={message.content + loadingCursor} />
                           }
                        </>
                    ) : (
                       message.content && <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;