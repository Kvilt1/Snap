import { useMemo, useCallback, CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ChatHistory, FriendsData, UsernameMappings } from '../types/snapchat';
import { parseISO, format, isAfter } from 'date-fns';
import { MessageSquare, Users } from 'lucide-react';
import { getDisplayName } from '../utils/userMappings';
import '../styles/ConversationList.css';

interface ConversationListProps {
  chatHistory: ChatHistory;
  friendsData: FriendsData;
  onSelectConversation: (conversationId: string) => void;
  selectedConversation: string | null;
  globalSearchQuery: string;
  throwbackDate: Date | null;
  usernameMappings: UsernameMappings;
}

interface ConversationData {
  id: string;
  displayName: string;
  lastMessage: string;
  lastMessageDate: Date;
  messageCount: number;
  isGroupChat: boolean;
  participantCount: number;
  hasUnknownUsers: boolean;
}

const ITEM_HEIGHT = 72; // Height of each conversation item

function VirtualizedConversationList({
  chatHistory,
  friendsData,
  onSelectConversation,
  selectedConversation,
  globalSearchQuery,
  throwbackDate,
  usernameMappings
}: ConversationListProps) {
  
  // Process and filter conversations with optimizations
  const processedConversations = useMemo(() => {
    const hiddenTypes = new Set(['MEDIA', 'STATUS', 'STICKER']);
    const conversations: ConversationData[] = [];
    
    // Process each conversation
    Object.entries(chatHistory).forEach(([conversationId, messages]) => {
      if (!messages || messages.length === 0) return;
      
      // Filter messages in a single pass
      let lastValidMessage = null;
      let messageCount = 0;
      let hasSearchMatch = false;
      const participants = new Set<string>();
      let conversationTitle = null;
      
      // Process messages from end to start for efficiency (find last valid message faster)
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        
        // Track participants
        participants.add(msg.From);
        
        // Check for group title
        if (msg["Conversation Title"]) {
          conversationTitle = msg["Conversation Title"];
        }
        
        // Skip hidden types
        if (hiddenTypes.has(msg["Media Type"])) continue;
        
        // Skip empty TEXT messages
        if (msg["Media Type"] === 'TEXT' && (!msg.Content || !msg.Content.trim())) {
          continue;
        }
        
        // Apply throwback filter
        if (throwbackDate) {
          const msgDate = parseISO(msg.Created.replace(' UTC', 'Z'));
          if (isAfter(msgDate, throwbackDate)) continue;
        }
        
        // Count valid messages
        messageCount++;
        
        // Check search match
        if (globalSearchQuery && msg.Content?.toLowerCase().includes(globalSearchQuery.toLowerCase())) {
          hasSearchMatch = true;
        }
        
        // Set last valid message if not set yet
        if (!lastValidMessage) {
          lastValidMessage = msg;
        }
      }
      
      // Skip if no valid messages or no search match (when searching)
      if (!lastValidMessage || (globalSearchQuery && !hasSearchMatch)) return;
      
      // Determine display name and chat type
      const isGroupChat = conversationTitle !== null || participants.size > 2;
      let displayName: string;
      
      if (isGroupChat && conversationTitle) {
        displayName = conversationTitle;
      } else {
        const friend = friendsData.Friends.find(f => f.Username === conversationId);
        displayName = friend?.["Display Name"] || conversationId;
      }
      
      // Check for unknown users
      const hasUnknownUsers = Array.from(participants).some(username => 
        !friendsData.Friends.some(f => f.Username === username) &&
        !usernameMappings[username]
      );
      
      conversations.push({
        id: conversationId,
        displayName,
        lastMessage: lastValidMessage.Content || `[${lastValidMessage["Media Type"]}]`,
        lastMessageDate: parseISO(lastValidMessage.Created.replace(' UTC', 'Z')),
        messageCount,
        isGroupChat,
        participantCount: participants.size,
        hasUnknownUsers
      });
    });
    
    // Sort by last message date (most recent first)
    conversations.sort((a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime());
    
    return conversations;
  }, [chatHistory, friendsData, globalSearchQuery, throwbackDate, usernameMappings]);

  // Row renderer
  const Row = useCallback(({ index, style }: { index: number; style: CSSProperties }) => {
    const conversation = processedConversations[index];
    if (!conversation) return null;
    
    return (
      <div
        style={style}
        className={`conversation-item ${selectedConversation === conversation.id ? 'selected' : ''}`}
        onClick={() => onSelectConversation(conversation.id)}
      >
        <div className="conversation-avatar">
          {conversation.isGroupChat ? (
            <Users size={24} />
          ) : (
            <MessageSquare size={24} />
          )}
        </div>
        <div className="conversation-info">
          <div className="conversation-header">
            <h4>{conversation.displayName}</h4>
            <span className="conversation-date">
              {format(conversation.lastMessageDate, 'MMM d, yyyy')}
            </span>
          </div>
          <div className="conversation-preview">
            <p>{conversation.lastMessage}</p>
            <div className="conversation-meta">
              <span className="message-count">{conversation.messageCount} messages</span>
              {conversation.isGroupChat && (
                <span className="participant-count">
                  👥 {conversation.participantCount}
                </span>
              )}
              {conversation.hasUnknownUsers && (
                <span className="unknown-users-indicator" title="Has unknown users">
                  ⚠️
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [processedConversations, selectedConversation, onSelectConversation]);

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Conversations</h2>
        <span className="conversation-count">
          {processedConversations.length} {globalSearchQuery ? 'found' : 'total'}
        </span>
      </div>
      
      {processedConversations.length > 0 ? (
        <List
          height={window.innerHeight - 120} // Adjust based on header height
          itemCount={processedConversations.length}
          itemSize={ITEM_HEIGHT}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      ) : (
        <div className="no-conversations">
          {globalSearchQuery 
            ? `No conversations found matching "${globalSearchQuery}"`
            : 'No conversations to display'
          }
        </div>
      )}
    </div>
  );
}

export default VirtualizedConversationList;