
import React from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';

interface ChatLogProps {
    messages: Message[];
    isLoading: boolean;
}

const ChatLog = React.forwardRef<HTMLDivElement, ChatLogProps>(({ messages, isLoading }, ref) => {
    return (
        <div ref={ref} className="flex-grow w-full overflow-y-auto pt-4 pb-8 space-y-6">
            {messages.map((msg, index) => (
                <ChatMessage 
                    key={index} 
                    message={msg} 
                    isLastMessage={index === messages.length - 1} 
                    isLoading={isLoading} 
                />
            ))}
        </div>
    );
});

export default ChatLog;
