import React, { useEffect, useRef } from 'react';
import { Message, DisplayPart } from '../types';
import { UserIcon, FileIcon, GoogleIcon, CodeIcon, LinkIcon, ThumbsUpIcon, ThumbsDownIcon, SparklesIcon, KebabMenuIcon, InfoIcon } from './icons/Icons';
import { GroundingMetadata } from '@google/genai';

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
                if (pre.querySelector('.copy-btn-container')) return;

                const wrapper = document.createElement('div');
                wrapper.className = 'relative group';

                const copyButtonContainer = document.createElement('div');
                copyButtonContainer.className = 'copy-btn-container absolute top-2 right-2';
                const copyButton = document.createElement('button');
                copyButton.className = 'p-1.5 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity';
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

    return <div ref={contentRef} className="prose dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-headings:font-semibold" />;
};

const ExecutableCodeBlock: React.FC<{ code: string }> = ({ code }) => (
    <div className="my-2 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
        <div className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center">
            <CodeIcon />
            <span className="ml-2">Executable Code</span>
        </div>
        <pre className="p-3 text-sm overflow-x-auto"><code className="language-python">{code}</code></pre>
    </div>
);

const CodeResultBlock: React.FC<{ output: string }> = ({ output }) => (
    <div className="my-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
        <div className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Result</div>
        <pre className="p-3 text-sm text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">{output}</pre>
    </div>
);

const getDomainFromUri = (uri: string | undefined): string => {
    if (!uri) return '';
    try {
        const hostname = new URL(uri).hostname;
        return hostname.replace(/^www\./, '');
    } catch (e) {
        return uri;
    }
};

const GroundingDisplay: React.FC<{ metadata: GroundingMetadata }> = ({ metadata }) => {
    const webSources = metadata.groundingChunks?.filter(s => s.web) ?? [];
    // Fix: Changed `searchQueries` to `webSearchQueries` on the `GroundingMetadata` type to align with the correct property name for accessing search queries from Google Search grounding.
    const searchQueries = metadata.webSearchQueries ?? [];

    return (
        <div className="mt-4 space-y-6 text-slate-700 dark:text-slate-300">
            {webSources.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center">
                        Sources <InfoIcon className="ml-1.5" />
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                        {webSources.map((source, index) => (
                            <li key={`web-${index}`} id={`source-${index + 1}`} className="text-slate-600 dark:text-slate-400">
                                <a href={source.web!.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                                    {getDomainFromUri(source.web?.uri)}
                                </a>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
            {searchQueries.length > 0 && (
                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Google Search Suggestions</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Display of Search Suggestions is required when using Grounding with Google Search. <a href="#" className="text-blue-400 hover:underline">Learn more</a>
                    </p>
                    <div className="space-y-2">
                        {searchQueries.map((query, index) => (
                           <div key={`query-${index}`} className="flex items-center p-2 bg-white dark:bg-slate-700/50 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                <GoogleIcon />
                                <span className="ml-3 text-sm text-slate-800 dark:text-slate-200">{query}</span>
                           </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLastMessage, isLoading }) => {
    const isModel = message.role === 'model';

    useEffect(() => {
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
    
    const loadingCursor = '<span class="animate-pulse">▍</span>';
    const loadingDots = `<div class="flex items-center space-x-1">
             <div class="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
             <div class="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
             <div class="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-pulse"></div>
           </div>`;

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const renderDisplayPart = (part: DisplayPart, index: number) => {
        let contentWithCitations = part.content;
        if (isModel && message.groundingMetadata?.groundingChunks) {
            contentWithCitations = contentWithCitations.replace(/\[(\d+)\]/g, (match, numberStr) => {
                const number = parseInt(numberStr, 10);
                if (number > 0 && number <= (message.groundingMetadata?.groundingChunks?.length ?? 0)) {
                    return `<sup><a href="#source-${number}" class="inline-block no-underline text-blue-500 dark:text-blue-400">[${number}]</a></sup>`;
                }
                return match;
            });
        }

        const finalContent = isLastMessage && isLoading && isModel && index === message.displayParts.length - 1 
            ? contentWithCitations + loadingCursor
            : contentWithCitations;

        switch (part.type) {
            case 'text':
                return <MarkdownRenderer key={index} content={finalContent} />;
            case 'executableCode':
                return <ExecutableCodeBlock key={index} code={part.content} />;
            case 'codeExecutionResult':
                return <CodeResultBlock key={index} output={part.content} />;
            default:
                return null;
        }
    };
    
    if (isModel) {
        return (
            <div className="flex flex-col">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <UserIcon /> {/* Placeholder, screenshot shows a different logo */}
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white">ChatGPT</p>
                    </div>
                     <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <button className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><SparklesIcon /></button>
                        <button className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><KebabMenuIcon /></button>
                    </div>
                </div>
                <div className="pl-11 mt-2">
                     <div className="leading-relaxed space-y-2 text-slate-800 dark:text-slate-200">
                        {isLastMessage && isLoading && message.displayParts.length === 0 ? (
                            <div dangerouslySetInnerHTML={{ __html: loadingDots }} />
                        ) : (
                            message.displayParts.map(renderDisplayPart)
                        )}
                    </div>
                     {message.groundingMetadata && (
                        <GroundingDisplay metadata={message.groundingMetadata} />
                    )}
                    <div className="flex items-center gap-2 mt-4 text-slate-500 dark:text-slate-400">
                        <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><ThumbsUpIcon /></button>
                        <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><ThumbsDownIcon /></button>
                    </div>
                </div>
            </div>
        );
    }

    // User message
    return (
        <div className="flex items-start gap-3 flex-row-reverse">
            <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
                 <div className="p-4 rounded-xl bg-blue-600 text-white">
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {message.attachments.map((att, index) => (
                                <div key={index} className="w-full">
                                    {att.previewUrl ? (
                                        <img src={att.previewUrl} alt="User attachment" className="w-full h-auto object-cover rounded-lg border border-blue-300 dark:border-blue-400" />
                                    ) : (
                                        <div className="flex items-center space-x-2 p-3 rounded-lg border h-full w-full bg-blue-500 border-blue-400">
                                            <div className="flex-shrink-0">
                                                <FileIcon />
                                            </div>
                                            <div className="text-sm overflow-hidden flex-grow">
                                                <p className="font-medium truncate text-white" title={att.file.name}>{att.file.name}</p>
                                                <p className="text-xs text-blue-100 dark:text-blue-200">{formatFileSize(att.file.size)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="leading-relaxed space-y-2 text-white">
                        {message.displayParts.map(renderDisplayPart)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;