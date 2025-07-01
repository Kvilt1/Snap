import { useMemo } from 'react'
import { ChatHistory, FriendsData, UsernameMappings } from '../types/snapchat'
import { getDisplayName } from '../utils/userMappings'
import { format, parseISO } from 'date-fns'
import '../styles/ConversationList.css'

interface ConversationListProps {
  chatHistory: ChatHistory;
  friendsData: FriendsData;
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  throwbackDate: Date | null;
  searchQuery: string;
  usernameMappings: UsernameMappings;
}

function ConversationList({
  chatHistory,
  friendsData,
  selectedConversation,
  onSelectConversation,
  throwbackDate,
  searchQuery,
  usernameMappings
}: ConversationListProps) {
  // Create a map of usernames to display names
  const displayNameMap = useMemo(() => {
    const map = new Map<string, string>();
    friendsData.Friends.forEach(friend => {
      map.set(friend.Username, friend["Display Name"]);
    });
    return map;
  }, [friendsData]);

  // Filter and sort conversations
  const conversations = useMemo(() => {
    return Object.entries(chatHistory)
      .filter(([conversationId, messages]) => {
        // Filter by throwback date if set
        if (throwbackDate) {
          const hasMessagesBeforeDate = messages.some(msg => {
            const msgDate = parseISO(msg.Created.replace(' UTC', 'Z'));
            return msgDate <= throwbackDate;
          });
          if (!hasMessagesBeforeDate) return false;
        }

        // Filter by search query
        if (searchQuery) {
          const displayName = displayNameMap.get(conversationId) || conversationId;
          const matchesName = displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            conversationId.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesContent = messages.some(msg => 
            msg.Content?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return matchesName || matchesContent;
        }

        return true;
      })
      .map(([conversationId, messages]) => {
        // Filter out hidden media types and empty text messages
        let filteredMessages = messages.filter(msg => {
          const hiddenTypes = ['MEDIA', 'STATUS', 'STICKER'];
          if (hiddenTypes.includes(msg["Media Type"])) return false;
          if (msg["Media Type"] === 'TEXT' && (!msg.Content || !msg.Content.trim())) return false;
          return true;
        });
        
        // Then filter by throwback date
        if (throwbackDate) {
          filteredMessages = filteredMessages.filter(msg => parseISO(msg.Created.replace(' UTC', 'Z')) <= throwbackDate);
        }

        // Sort messages chronologically to get the actual latest message
        filteredMessages.sort((a, b) => {
          const dateA = parseISO(a.Created.replace(' UTC', 'Z'));
          const dateB = parseISO(b.Created.replace(' UTC', 'Z'));
          return dateA.getTime() - dateB.getTime();
        });
        
        const lastMessage = filteredMessages[filteredMessages.length - 1];
        const lastMessageDate = lastMessage ? parseISO(lastMessage.Created.replace(' UTC', 'Z')) : null;

        // Create preview text for last message
        const getMessagePreview = (msg: any) => {
          if (!msg) return 'No messages';
          
          const mediaType = msg["Media Type"];
          
          if (msg.Content && msg.Content.trim()) {
            return msg.Content;
          }
          
          switch (mediaType) {
            case 'STATUSERASEDSNAPMESSAGE':
              return 'Chat deleted';
            case 'STATUSPARTICIPANTREMOVED':
              return 'Participant removed';
            case 'STATUSCALLENDEDAUDIO':
              return '📞 Voice call ended';
            case 'STATUSCALLENDEDVIDEO':
              return '📹 Video call ended';
            case 'STATUSCALLMISSEDAUDIO':
              return '📞 Missed voice call';
            case 'STATUSCALLMISSEDVIDEO':
              return '📹 Missed video call';
            case 'NOTE':
              return '🎤 Voice Note';
            case 'MEDIA':
            case 'STATUS':
            case 'STICKER':
              return null; // These will be filtered out
            default:
              return `[${mediaType}]`;
          }
        };

        // Determine if this is a group chat and get appropriate display name
        const isGroupChat = filteredMessages.some(msg => msg["Conversation Title"] !== null);
        const groupTitle = filteredMessages.find(msg => msg["Conversation Title"])?.['Conversation Title'];
        
        const getConversationDisplayName = () => {
          if (isGroupChat && groupTitle) {
            return groupTitle;
          }
          return getDisplayName(conversationId, friendsData, usernameMappings);
        };
        
        // Get participant count for group chats
        const uniqueParticipants = isGroupChat 
          ? new Set(filteredMessages.map(msg => msg.From)).size
          : null;

        return {
          id: conversationId,
          displayName: getConversationDisplayName(),
          lastMessage: getMessagePreview(lastMessage) || 'No recent messages',
          lastMessageDate,
          messageCount: filteredMessages.length,
          isGroupChat,
          participantCount: uniqueParticipants
        };
      })
      .filter(conv => conv.messageCount > 0)
      .sort((a, b) => {
        if (!a.lastMessageDate || !b.lastMessageDate) return 0;
        return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
      });
  }, [chatHistory, displayNameMap, throwbackDate, searchQuery]);

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Conversations</h2>
        <span className="conversation-count">{conversations.length}</span>
      </div>
      <div className="conversations">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${selectedConversation === conv.id ? 'selected' : ''}`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="conversation-avatar">
              {conv.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="conversation-info">
              <div className="conversation-name">
                {conv.displayName}
                {conv.isGroupChat && (
                  <span className="group-indicator">
                    👥 {conv.participantCount}
                  </span>
                )}
              </div>
              <div className="conversation-preview">{conv.lastMessage}</div>
            </div>
            <div className="conversation-meta">
              {conv.lastMessageDate && (
                <div className="conversation-date">
                  {format(conv.lastMessageDate, 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConversationList;