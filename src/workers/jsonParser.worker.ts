// Web Worker for parsing large JSON files in chunks
import { ChatHistory, FriendsData, Account, AccountHistory, ChatMessage } from '../types/snapchat';

interface ParseMessage {
  type: 'parse';
  fileName: string;
  content: string;
}

interface ProgressMessage {
  type: 'progress';
  fileName: string;
  progress: number;
}

interface ResultMessage {
  type: 'result';
  fileName: string;
  data: any;
}

interface ErrorMessage {
  type: 'error';
  fileName: string;
  error: string;
}

// Parse JSON in chunks to prevent blocking
async function parseJSON(content: string, fileName: string): Promise<any> {
  try {
    // For very large files, we could implement streaming JSON parsing
    // For now, we'll use regular parsing with progress updates
    postMessage({
      type: 'progress',
      fileName,
      progress: 0.5
    } as ProgressMessage);
    
    const data = JSON.parse(content);
    
    postMessage({
      type: 'progress',
      fileName,
      progress: 1
    } as ProgressMessage);
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse ${fileName}: ${error}`);
  }
}

self.addEventListener('message', async (event: MessageEvent<ParseMessage>) => {
  const { type, fileName, content } = event.data;
  
  if (type === 'parse') {
    try {
      const data = await parseJSON(content, fileName);
      
      // Post process data based on file type
      if (fileName === 'chat_history.json') {
        // Convert chat history to optimized format
        const optimizedData: ChatHistory = {};
        
        // Process in chunks to avoid blocking
        const entries = Object.entries(data);
        const chunkSize = 100;
        
        for (let i = 0; i < entries.length; i += chunkSize) {
          const chunk = entries.slice(i, i + chunkSize);
          
          for (const [key, value] of chunk) {
            optimizedData[key] = value as ChatMessage[];
          }
          
          // Report progress
          postMessage({
            type: 'progress',
            fileName,
            progress: 0.5 + (i / entries.length) * 0.5
          } as ProgressMessage);
        }
        
        postMessage({
          type: 'result',
          fileName,
          data: optimizedData
        } as ResultMessage);
      } else {
        // For other files, just return parsed data
        postMessage({
          type: 'result',
          fileName,
          data
        } as ResultMessage);
      }
    } catch (error) {
      postMessage({
        type: 'error',
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ErrorMessage);
    }
  }
});

export {};