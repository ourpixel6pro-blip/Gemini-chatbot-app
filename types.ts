export interface Message {
    role: 'user' | 'model';
    content: string;
    attachments?: Array<{
        file: File;
        previewUrl?: string; // Only for image types
    }>;
}