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

// Parse JSON content to prevent blocking main thread
async function parseJSONContent(content: string, fileName: string): Promise<any> {
  try {
    postMessage({
      type: 'progress',
      fileName,
      progress: 0.2
    } as ProgressMessage);
    
    const data = JSON.parse(content);
    
    postMessage({
      type: 'progress',
      fileName,
      progress: 0.8
    } as ProgressMessage);
    
    // Clear content reference to free memory immediately after parsing
    content = '';
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse ${fileName}: ${error}`);
  }
}

self.addEventListener('message', async (event: MessageEvent<ParseMessage>) => {
  const { type, fileName, content } = event.data;
  
  if (type === 'parse') {
    try {
      const data = await parseJSONContent(content, fileName);
      
      // Post process data based on file type
      if (fileName.includes('chat_history')) {
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
        
        // Data will be garbage collected after this function ends
        
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
        
        // Data will be garbage collected after this function ends
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