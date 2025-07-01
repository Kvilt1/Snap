import { useState, useMemo, useRef, useEffect, useCallback, CSSProperties } from 'react'
import { VariableSizeList as List } from 'react-window'
import { ChatMessage, FriendsData, UsernameMappings } from '../types/snapchat'
import { format, parseISO } from 'date-fns'
import { Search, Phone, PhoneOff, Video, VideoOff, Trash2, Users } from 'lucide-react'
import TimelineSlider from './TimelineSlider'
import UsernameMappingModal from './UsernameMappingModal'
import { getDisplayName, getUnknownUsersInConversation } from '../utils/userMappings'
import { filterMessagesByDateRange, ensureMessagesSorted, getCachedDate } from '../utils/dateFiltering'
import '../styles/ChatWindow.css'

interface ChatWindowProps {
  conversation: ChatMessage[];
  conversationId: string;
  friendsData: FriendsData;
  throwbackDate: Date | null;
  usernameMappings: UsernameMappings;
  onUpdateMappings: (mappings: UsernameMappings, friendsToUpdate?: {[oldUsername: string]: string}) => void;
}

interface MessageGroup {
  date: string;
  messages: ChatMessage[];
  startIndex: number;
}

interface RowData {
  type: 'date' | 'message' | 'system';
  data: any;
  messageIndex?: number;
  groupDate?: string;
}

// Cache for row heights to improve performance
const rowHeightCache = new Map<string, number>();

function VirtualizedChatWindow({
  conversation,
  conversationId,
  friendsData,
  throwbackDate,
  usernameMappings,
  onUpdateMappings
}: ChatWindowProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const listRef = useRef<List>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Determine if this is a group chat and get appropriate display name
  const { isGroupChat, displayName } = useMemo(() => {
    const hasGroupTitle = conversation.some(msg => msg["Conversation Title"] !== null);
    const groupTitle = conversation.find(msg => msg["Conversation Title"])?.['Conversation Title'];
    
    if (hasGroupTitle && groupTitle) {
      return {
        isGroupChat: true,
        displayName: groupTitle
      };
    }
    
    const friend = friendsData.Friends.find(f => f.Username === conversationId);
    return {
      isGroupChat: false,
      displayName: friend?.["Display Name"] || conversationId
    };
  }, [conversation, friendsData, conversationId]);
  
  // Create a map of usernames to display names using mappings and friends data
  const participantDisplayNames = useMemo(() => {
    const map = new Map<string, string>();
    friendsData.Friends.forEach(friend => {
      map.set(friend.Username, friend["Display Name"]);
    });
    
    // Add manual mappings (these override friends data)
    Object.entries(usernameMappings).forEach(([username, mapping]) => {
      map.set(username, mapping.displayName);
    });
    
    return map;
  }, [friendsData, usernameMappings]);

  // Detect unknown users in this conversation
  const unknownUsers = useMemo(() => {
    return getUnknownUsersInConversation(conversation, friendsData, usernameMappings);
  }, [conversation, friendsData, usernameMappings]);

  const hasUnknownUsersInConversation = unknownUsers.length > 0;
  
  // Generate consistent colors for participants in group chats
  const getParticipantColor = useMemo(() => {
    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f',
      '#8e44ad', '#27ae60', '#2980b9', '#c0392b', '#d35400'
    ];
    
    return (username: string) => {
      if (!isGroupChat) {
        return '#3498dbdd';
      }
      
      const hash = username.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const baseColor = colors[Math.abs(hash) % colors.length];
      return baseColor + 'dd';
    };
  }, [isGroupChat]);

  // Filter messages with optimized processing
  const filteredMessages = useMemo(() => {
    const hiddenTypes = new Set(['MEDIA', 'STATUS', 'STICKER']);
    
    // First ensure messages are sorted for binary search optimization
    const sortedMessages = ensureMessagesSorted(conversation);
    
    // Apply date filtering first using binary search
    let dateFiltered = sortedMessages;
    if (throwbackDate) {
      dateFiltered = filterMessagesByDateRange(sortedMessages, undefined, throwbackDate);
    }
    
    // Then apply other filters in a single pass
    const filtered = dateFiltered.filter(msg => {
      // Skip hidden types
      if (hiddenTypes.has(msg["Media Type"])) return false;
      
      // Skip empty TEXT messages
      if (msg["Media Type"] === 'TEXT' && (!msg.Content || !msg.Content.trim())) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !msg.Content?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    return filtered;
  }, [conversation, throwbackDate, searchQuery]);

  // Create flattened row data for virtualization
  const rowData = useMemo(() => {
    const rows: RowData[] = [];
    const messagesByDate = new Map<string, ChatMessage[]>();
    
    // Group messages by date using cached date parsing
    filteredMessages.forEach(msg => {
      const msgDate = getCachedDate(msg.Created);
      const date = format(msgDate, 'MMMM d, yyyy');
      if (!messagesByDate.has(date)) {
        messagesByDate.set(date, []);
      }
      messagesByDate.get(date)!.push(msg);
    });
    
    // Create flattened list with date headers
    messagesByDate.forEach((messages, date) => {
      rows.push({ type: 'date', data: date });
      
      messages.forEach((msg, index) => {
        const mediaType = msg["Media Type"];
        
        // System messages
        if (mediaType === 'STATUSERASEDSNAPMESSAGE' || 
            mediaType === 'STATUSPARTICIPANTREMOVED' ||
            mediaType.startsWith('STATUSCALL')) {
          rows.push({ type: 'system', data: msg });
        } else {
          // Regular messages
          rows.push({ 
            type: 'message', 
            data: msg, 
            messageIndex: index,
            groupDate: date 
          });
        }
      });
    });
    
    return rows;
  }, [filteredMessages]);

  // Calculate row height based on content
  const getItemSize = useCallback((index: number) => {
    const row = rowData[index];
    const cacheKey = `${row.type}-${row.data['Created(microseconds)'] || row.data}`;
    
    // Check cache first
    if (rowHeightCache.has(cacheKey)) {
      return rowHeightCache.get(cacheKey)!;
    }
    
    let height = 0;
    
    switch (row.type) {
      case 'date':
        height = 40; // Date divider height
        break;
      case 'system':
        height = 36; // System message height
        break;
      case 'message':
        const msg = row.data as ChatMessage;
        const baseHeight = 24; // Base height for message
        const senderHeight = 20; // Height for sender name if shown
        const contentLines = Math.ceil((msg.Content?.length || 10) / 50); // Rough estimate
        const contentHeight = contentLines * 20;
        
        // Check if sender name should be shown
        const prevRow = index > 0 ? rowData[index - 1] : null;
        const showSender = !prevRow || 
                          prevRow.type !== 'message' || 
                          prevRow.data.From !== msg.From ||
                          prevRow.data.IsSender !== msg.IsSender;
        
        height = baseHeight + contentHeight + (showSender ? senderHeight : 0) + 8; // padding
        break;
    }
    
    // Cache the calculated height
    rowHeightCache.set(cacheKey, height);
    return height;
  }, [rowData]);

  // Render individual row
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
    const row = rowData[index];
    
    if (row.type === 'date') {
      return (
        <div style={style}>
          <div className="date-divider">
            <span>{row.data}</span>
          </div>
        </div>
      );
    }
    
    const msg = row.data as ChatMessage;
    const mediaType = msg["Media Type"];
    const isSent = msg.IsSender;
    
    // Handle system messages
    if (row.type === 'system') {
      if (mediaType === 'STATUSERASEDSNAPMESSAGE') {
        return (
          <div style={style}>
            <div className="system-message">
              <Trash2 size={14} />
              <span>{isSent ? 'You' : displayName} deleted a chat</span>
              <span className="system-time">
                {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
              </span>
            </div>
          </div>
        );
      }
      
      if (mediaType === 'STATUSPARTICIPANTREMOVED') {
        return (
          <div style={style}>
            <div className="system-message">
              <span>Participant removed</span>
              <span className="system-time">
                {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
              </span>
            </div>
          </div>
        );
      }
      
      // Handle call messages
      const callIcons: Record<string, React.ReactElement> = {
        'STATUSCALLENDEDAUDIO': <Phone size={16} className="call-icon ended" />,
        'STATUSCALLENDEDVIDEO': <Video size={16} className="call-icon ended" />,
        'STATUSCALLMISSEDAUDIO': <PhoneOff size={16} className="call-icon missed" />,
        'STATUSCALLMISSEDVIDEO': <VideoOff size={16} className="call-icon missed" />
      };
      
      if (callIcons[mediaType]) {
        const isCallEnded = mediaType.includes('ENDED');
        const isVideo = mediaType.includes('VIDEO');
        const callText = isCallEnded 
          ? `${isVideo ? 'Video' : 'Voice'} call ended`
          : `Missed ${isVideo ? 'video' : 'voice'} call`;
        
        return (
          <div style={style}>
            <div className="call-message">
              {callIcons[mediaType]}
              <span>{callText}</span>
              <span className="call-time">
                {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
              </span>
            </div>
          </div>
        );
      }
    }
    
    // Regular messages
    const prevRow = index > 0 ? rowData[index - 1] : null;
    const nextRow = index < rowData.length - 1 ? rowData[index + 1] : null;
    
    const showSenderName = (
      !prevRow || 
      prevRow.type !== 'message' ||
      prevRow.data.From !== msg.From || 
      prevRow.data.IsSender !== msg.IsSender
    );
    
    const isFirstInGroup = showSenderName;
    const isLastInGroup = (
      !nextRow ||
      nextRow.type !== 'message' ||
      nextRow.data.From !== msg.From ||
      nextRow.data.IsSender !== msg.IsSender
    );
    
    const participantColor = getParticipantColor(msg.From);
    
    return (
      <div style={style}>
        <div
          id={`msg-${msg['Created(microseconds)']}`}
          className={`message ${isSent ? 'sent' : 'received'} ${isGroupChat ? 'group-chat' : ''} ${showSenderName ? 'show-sender' : 'grouped'} ${isFirstInGroup ? 'first-in-group' : ''} ${isLastInGroup ? 'last-in-group' : ''}`}
        >
          {showSenderName && (
            <div 
              className="sender-name"
              style={{
                color: isSent ? '#ff4757' : (participantColor || '#3498db')
              }}
            >
              {isSent ? 'Me' : (isGroupChat ? getDisplayName(msg.From, friendsData, usernameMappings) : displayName)}
            </div>
          )}
          <div 
            className="message-container"
            style={{
              color: isSent ? '#ff4757' : (participantColor || '#3498db')
            }}
          >
            <div className="message-content">
              <div className="message-bubble">
                {msg.Content ? (
                  <div className="message-text">{msg.Content}</div>
                ) : (
                  <div className="message-media">[{mediaType}]</div>
                )}
              </div>
            </div>
            <div className="message-timestamp">
              {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'HH.mm')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Scroll to bottom on conversation change
  useEffect(() => {
    if (listRef.current && rowData.length > 0) {
      listRef.current.scrollToItem(rowData.length - 1, 'end');
    }
  }, [conversationId, rowData.length]);

  const handleTimelineChange = useCallback((date: Date) => {
    // Find the first message on or after this date
    const targetIndex = rowData.findIndex(row => {
      if (row.type === 'message') {
        const msgDate = parseISO(row.data.Created.replace(' UTC', 'Z'));
        return msgDate >= date;
      }
      return false;
    });

    if (targetIndex >= 0 && listRef.current) {
      listRef.current.scrollToItem(targetIndex, 'center');
    }
  }, [rowData]);

  // Clear row height cache when conversation changes
  useEffect(() => {
    rowHeightCache.clear();
  }, [conversationId]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{displayName}</h3>
          <span className="message-count">
            {filteredMessages.length} messages
            {isGroupChat && (
              <span className="participant-count">
                • {new Set(conversation.map(msg => msg.From)).size} participants
              </span>
            )}
          </span>
        </div>
        <div className="chat-actions">
          {hasUnknownUsersInConversation && (
            <button
              className="map-users-button"
              onClick={() => setShowMappingModal(true)}
              title={`Map ${unknownUsers.length} unknown user${unknownUsers.length > 1 ? 's' : ''}`}
            >
              <Users size={20} />
              {unknownUsers.length > 1 && <span className="unknown-count">{unknownUsers.length}</span>}
            </button>
          )}
          <button
            className="search-toggle"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search size={20} />
          </button>
        </div>
      </div>
      
      {showSearch && (
        <div className="chat-search">
          <input
            type="text"
            placeholder="Search in conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {filteredMessages.length > 0 && (
        <TimelineSlider
          messages={filteredMessages}
          onDateChange={handleTimelineChange}
        />
      )}

      <div className="chat-messages" ref={chatWindowRef}>
        {rowData.length > 0 ? (
          <List
            ref={listRef}
            height={chatWindowRef.current?.clientHeight || 600}
            itemCount={rowData.length}
            itemSize={getItemSize}
            width="100%"
            overscanCount={10}
            onItemsRendered={({ visibleStopIndex }) => {
              // Dynamically adjust height based on container
              if (chatWindowRef.current && listRef.current) {
                const height = chatWindowRef.current.clientHeight;
                if (height > 0) {
                  listRef.current.resetAfterIndex(0);
                }
              }
            }}
          >
            {Row}
          </List>
        ) : (
          <div className="no-messages">No messages to display</div>
        )}
      </div>
      
      <UsernameMappingModal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        unmappedUsernames={unknownUsers}
        friendsData={friendsData}
        currentMappings={usernameMappings}
        onSaveMappings={onUpdateMappings}
      />
    </div>
  );
}

export default VirtualizedChatWindow;