import { ChatMessage, ChatHistory } from '../types/snapchat';

export interface SearchResult {
  conversationId: string;
  messageIndex: number;
  message: ChatMessage;
  relevanceScore: number;
}

export interface SearchIndex {
  // Word to message mapping
  wordIndex: Map<string, Set<string>>; // word -> Set of messageIds
  // Message ID to message data
  messageMap: Map<string, { conversationId: string; messageIndex: number; message: ChatMessage }>;
  // Conversation index for faster filtering
  conversationIndex: Map<string, Set<string>>; // conversationId -> Set of messageIds
}

// Create a unique ID for each message
function getMessageId(conversationId: string, messageIndex: number): string {
  return `${conversationId}:${messageIndex}`;
}

// Simple tokenizer that splits on whitespace and removes punctuation
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out very short words
}

// Calculate relevance score based on word frequency and position
function calculateRelevanceScore(message: ChatMessage, searchTerms: string[]): number {
  if (!message.Content) return 0;
  
  const content = message.Content.toLowerCase();
  let score = 0;
  
  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    const regex = new RegExp(termLower, 'gi');
    const matches = content.match(regex);
    
    if (matches) {
      // Base score for each match
      score += matches.length;
      
      // Bonus for exact word matches
      const wordRegex = new RegExp(`\\b${termLower}\\b`, 'gi');
      const wordMatches = content.match(wordRegex);
      if (wordMatches) {
        score += wordMatches.length * 2;
      }
      
      // Bonus for matches at the beginning
      if (content.startsWith(termLower)) {
        score += 3;
      }
    }
  }
  
  return score;
}

export function buildSearchIndex(chatHistory: ChatHistory): SearchIndex {
  const wordIndex = new Map<string, Set<string>>();
  const messageMap = new Map<string, { conversationId: string; messageIndex: number; message: ChatMessage }>();
  const conversationIndex = new Map<string, Set<string>>();

  // Process each conversation
  Object.entries(chatHistory).forEach(([conversationId, messages]) => {
    const conversationMessageIds = new Set<string>();
    
    messages.forEach((message, messageIndex) => {
      // Skip messages without content
      if (!message.Content || message.Content.trim() === '') return;
      
      const messageId = getMessageId(conversationId, messageIndex);
      
      // Store message data
      messageMap.set(messageId, { conversationId, messageIndex, message });
      conversationMessageIds.add(messageId);
      
      // Tokenize message content
      const tokens = tokenize(message.Content);
      
      // Index each word
      tokens.forEach(word => {
        if (!wordIndex.has(word)) {
          wordIndex.set(word, new Set());
        }
        wordIndex.get(word)!.add(messageId);
      });
    });
    
    // Store conversation index
    if (conversationMessageIds.size > 0) {
      conversationIndex.set(conversationId, conversationMessageIds);
    }
  });

  return { wordIndex, messageMap, conversationIndex };
}

export function searchMessages(
  index: SearchIndex,
  query: string,
  options: {
    maxResults?: number;
    conversationId?: string;
    sortByRelevance?: boolean;
  } = {}
): SearchResult[] {
  const { maxResults = 100, conversationId, sortByRelevance = true } = options;
  
  if (!query.trim()) return [];
  
  const searchTerms = tokenize(query);
  if (searchTerms.length === 0) return [];
  
  // Find messages that contain any of the search terms
  const candidateMessageIds = new Set<string>();
  
  for (const term of searchTerms) {
    // Find partial matches for autocomplete-like behavior
    for (const [indexedWord, messageIds] of index.wordIndex.entries()) {
      if (indexedWord.includes(term)) {
        messageIds.forEach(id => candidateMessageIds.add(id));
      }
    }
  }
  
  // Filter by conversation if specified
  if (conversationId && index.conversationIndex.has(conversationId)) {
    const conversationMessages = index.conversationIndex.get(conversationId)!;
    // Keep only messages from the specified conversation
    for (const messageId of candidateMessageIds) {
      if (!conversationMessages.has(messageId)) {
        candidateMessageIds.delete(messageId);
      }
    }
  }
  
  // Convert to search results with relevance scores
  const results: SearchResult[] = [];
  
  for (const messageId of candidateMessageIds) {
    const messageData = index.messageMap.get(messageId);
    if (!messageData) continue;
    
    const relevanceScore = calculateRelevanceScore(messageData.message, searchTerms);
    
    // Only include messages with positive relevance
    if (relevanceScore > 0) {
      results.push({
        conversationId: messageData.conversationId,
        messageIndex: messageData.messageIndex,
        message: messageData.message,
        relevanceScore
      });
    }
  }
  
  // Sort by relevance or date
  if (sortByRelevance) {
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } else {
    results.sort((a, b) => {
      const dateA = new Date(a.message.Created.replace(' UTC', 'Z'));
      const dateB = new Date(b.message.Created.replace(' UTC', 'Z'));
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  // Limit results
  return results.slice(0, maxResults);
}

// Utility function for highlighting search terms in text
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const searchTerms = tokenize(query);
  let highlightedText = text;
  
  for (const term of searchTerms) {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  }
  
  return highlightedText;
}