import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatHistory, FriendsData, Account, AccountHistory } from '../types/snapchat';
import { SearchIndex, buildSearchIndex } from '../utils/searchIndex';

interface DataState {
  chatHistory: ChatHistory | null;
  friendsData: FriendsData | null;
  accountData: Account | null;
  accountHistoryData: AccountHistory | null;
  searchIndex: SearchIndex | null;
  loading: boolean;
  progress: { [key: string]: number };
  error: string | null;
}

interface ParseResult {
  fileName: string;
  data: any;
}

// Create a singleton worker instance
let parserWorker: Worker | null = null;

function getParserWorker(): Worker {
  if (!parserWorker) {
    parserWorker = new Worker(
      new URL('../workers/jsonParser.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return parserWorker;
}

export function useOptimizedData() {
  const [dataState, setDataState] = useState<DataState>({
    chatHistory: null,
    friendsData: null,
    accountData: null,
    accountHistoryData: null,
    searchIndex: null,
    loading: false,
    progress: {},
    error: null
  });

  // Memoize conversation count for performance
  const conversationCount = useMemo(() => {
    if (!dataState.chatHistory) return 0;
    return Object.keys(dataState.chatHistory).length;
  }, [dataState.chatHistory]);

  // Memoize total message count
  const totalMessageCount = useMemo(() => {
    if (!dataState.chatHistory) return 0;
    return Object.values(dataState.chatHistory).reduce(
      (total, messages) => total + messages.length, 
      0
    );
  }, [dataState.chatHistory]);

  // Build search index when chat history is loaded
  useEffect(() => {
    if (dataState.chatHistory && !dataState.searchIndex) {
      // Build search index in background
      const timeStart = performance.now();
      const index = buildSearchIndex(dataState.chatHistory);
      const timeEnd = performance.now();
      
      console.log(`Search index built in ${(timeEnd - timeStart).toFixed(1)}ms`);
      
      setDataState(prev => ({
        ...prev,
        searchIndex: index
      }));
    }
  }, [dataState.chatHistory, dataState.searchIndex]);

  const loadFiles = useCallback(async (files: FileList) => {
    setDataState(prev => ({ ...prev, loading: true, error: null, progress: {} }));

    const worker = getParserWorker();
    const results: { [key: string]: any } = {};
    const pendingFiles = new Set<string>();

    // Setup worker message handler
    const handleMessage = (event: MessageEvent) => {
      const { type, fileName, progress, data, error } = event.data;

      switch (type) {
        case 'progress':
          setDataState(prev => ({
            ...prev,
            progress: { ...prev.progress, [fileName]: progress }
          }));
          break;

        case 'result':
          results[fileName] = data;
          pendingFiles.delete(fileName);

          // Update state with parsed data
          setDataState(prev => {
            const newState = { ...prev };
            
            switch (fileName) {
              case 'chat_history.json':
                newState.chatHistory = data as ChatHistory;
                break;
              case 'friends.json':
                newState.friendsData = data as FriendsData;
                break;
              case 'account.json':
                newState.accountData = data as Account;
                break;
              case 'account_history.json':
                newState.accountHistoryData = data as AccountHistory;
                break;
            }

            // Check if all files are processed
            if (pendingFiles.size === 0) {
              newState.loading = false;
            }

            return newState;
          });
          break;

        case 'error':
          setDataState(prev => ({
            ...prev,
            error: error || 'Failed to parse file',
            loading: false
          }));
          break;
      }
    };

    worker.addEventListener('message', handleMessage);

    // Process files
    try {
      const fileArray = Array.from(files);
      
      for (const file of fileArray) {
        if (file.name.endsWith('.json')) {
          pendingFiles.add(file.name);
          
          // Read file in chunks for better performance
          const text = await file.text();
          
          worker.postMessage({
            type: 'parse',
            fileName: file.name,
            content: text
          });
        }
      }

      // If no JSON files found
      if (pendingFiles.size === 0) {
        setDataState(prev => ({
          ...prev,
          loading: false,
          error: 'No JSON files found'
        }));
      }
    } catch (error) {
      setDataState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load files'
      }));
    }

    // Cleanup
    return () => {
      worker.removeEventListener('message', handleMessage);
    };
  }, []);

  const loadDirectory = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    const files: File[] = [];
    
    try {
      // @ts-ignore - values() is available in the File System Access API
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          const file = await entry.getFile();
          files.push(file);
        }
      }

      // Convert to FileList-like object
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      
      await loadFiles(dt.files);
    } catch (error) {
      setDataState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load directory'
      }));
    }
  }, [loadFiles]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (parserWorker) {
        parserWorker.terminate();
        parserWorker = null;
      }
    };
  }, []);

  return {
    ...dataState,
    conversationCount,
    totalMessageCount,
    loadFiles,
    loadDirectory
  };
}