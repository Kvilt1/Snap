import { ChatMessage } from '../types/snapchat';
import { parseISO } from 'date-fns';

// Binary search to find the first message on or after a given date
export function findFirstMessageAfterDate(messages: ChatMessage[], targetDate: Date): number {
  if (messages.length === 0) return -1;
  
  let left = 0;
  let right = messages.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const msgDate = parseISO(messages[mid].Created.replace(' UTC', 'Z'));
    
    if (msgDate >= targetDate) {
      result = mid;
      right = mid - 1; // Look for earlier messages
    } else {
      left = mid + 1;
    }
  }
  
  return result;
}

// Binary search to find the last message before or on a given date
export function findLastMessageBeforeDate(messages: ChatMessage[], targetDate: Date): number {
  if (messages.length === 0) return -1;
  
  let left = 0;
  let right = messages.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const msgDate = parseISO(messages[mid].Created.replace(' UTC', 'Z'));
    
    if (msgDate <= targetDate) {
      result = mid;
      left = mid + 1; // Look for later messages
    } else {
      right = mid - 1;
    }
  }
  
  return result;
}

// Optimized date range filtering using binary search
export function filterMessagesByDateRange(
  messages: ChatMessage[], 
  startDate?: Date, 
  endDate?: Date
): ChatMessage[] {
  if (messages.length === 0) return [];
  
  // If no date filters, return all messages
  if (!startDate && !endDate) return messages;
  
  let startIndex = 0;
  let endIndex = messages.length - 1;
  
  // Find start index using binary search
  if (startDate) {
    const foundStartIndex = findFirstMessageAfterDate(messages, startDate);
    if (foundStartIndex !== -1) {
      startIndex = foundStartIndex;
    } else {
      // No messages after start date
      return [];
    }
  }
  
  // Find end index using binary search
  if (endDate) {
    const foundEndIndex = findLastMessageBeforeDate(messages, endDate);
    if (foundEndIndex !== -1) {
      endIndex = foundEndIndex;
    } else {
      // No messages before end date
      return [];
    }
  }
  
  // Return slice if valid range
  if (startIndex <= endIndex) {
    return messages.slice(startIndex, endIndex + 1);
  }
  
  return [];
}

// Pre-sort messages by date for binary search optimization
export function ensureMessagesSorted(messages: ChatMessage[]): ChatMessage[] {
  // Check if already sorted
  let isSorted = true;
  for (let i = 1; i < messages.length; i++) {
    const prevDate = parseISO(messages[i - 1].Created.replace(' UTC', 'Z'));
    const currDate = parseISO(messages[i].Created.replace(' UTC', 'Z'));
    if (prevDate > currDate) {
      isSorted = false;
      break;
    }
  }
  
  // Sort if needed
  if (!isSorted) {
    return [...messages].sort((a, b) => {
      const dateA = parseISO(a.Created.replace(' UTC', 'Z'));
      const dateB = parseISO(b.Created.replace(' UTC', 'Z'));
      return dateA.getTime() - dateB.getTime();
    });
  }
  
  return messages;
}

// Cache for parsed dates to avoid repeated parsing
const dateCache = new Map<string, Date>();

export function getCachedDate(dateString: string): Date {
  if (!dateCache.has(dateString)) {
    dateCache.set(dateString, parseISO(dateString.replace(' UTC', 'Z')));
  }
  return dateCache.get(dateString)!;
}

// Clear date cache when memory is needed
export function clearDateCache(): void {
  dateCache.clear();
}