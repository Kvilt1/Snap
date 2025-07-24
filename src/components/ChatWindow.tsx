import { useState, useMemo, useRef, useEffect } from 'react'
import { ChatMessage, FriendsData, UsernameMappings } from '../types/snapchat'
import { format, parseISO } from 'date-fns'
import { Search, Phone, PhoneOff, Video, VideoOff, Trash2, Users, Mic, Camera, Image, Sticker, Share, UserPlus, UserMinus, Save, MessageSquare, Bot, Tag } from 'lucide-react'
import TimelineSlider from './TimelineSlider'
import UsernameMappingModal from './UsernameMappingModal'
import { getDisplayName, getUnknownUsersInConversation, hasUnknownUsers } from '../utils/userMappings'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import '../styles/ChatWindow.css'

interface ChatWindowProps {
  conversation: ChatMessage[];
  conversationId: string;
  friendsData: FriendsData;
  usernameMappings: UsernameMappings;
  onUpdateMappings: (mappings: UsernameMappings, friendsToUpdate?: {[oldUsername: string]: string}) => void;
}

function ChatWindow({
  conversation,
  conversationId,
  friendsData,
  usernameMappings,
  onUpdateMappings
}: ChatWindowProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [showSearch, setShowSearch] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      // For individual chats, use a distinct blue color that contrasts well with red
      if (!isGroupChat) {
        return '#3498dbdd'; // Bright blue with opacity for good contrast with red
      }
      
      const hash = username.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const baseColor = colors[Math.abs(hash) % colors.length];
      // Add some opacity to blend better with dark theme
      return baseColor + 'dd'; // Add alpha for 87% opacity
    };
  }, [isGroupChat]);

  // Filter messages by throwback date and search
  const filteredMessages = useMemo(() => {
    let messages = [...conversation];
    
    // Filter out certain media types
    const hiddenTypes = ['MEDIA', 'STATUS', 'STICKER'];
    messages = messages.filter(msg => !hiddenTypes.includes(msg["Media Type"]));
    
    // Filter out empty TEXT messages
    messages = messages.filter(msg => {
      if (msg["Media Type"] === 'TEXT') {
        return msg.Content && msg.Content.trim() !== '';
      }
      return true;
    });

    // Filter by search query (debounced for performance)
    if (debouncedSearchQuery) {
      messages = messages.filter(msg => 
        msg.Content?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Sort messages chronologically (oldest first)
    messages.sort((a, b) => {
      const dateA = parseISO(a.Created.replace(' UTC', 'Z'));
      const dateB = parseISO(b.Created.replace(' UTC', 'Z'));
      return dateA.getTime() - dateB.getTime();
    });

    return messages;
  }, [conversation, debouncedSearchQuery]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [date: string]: ChatMessage[] } = {};
    
    filteredMessages.forEach(msg => {
      const date = format(parseISO(msg.Created.replace(' UTC', 'Z')), 'MMMM d, yyyy');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });

    return Object.entries(groups);
  }, [filteredMessages]);

  // Scroll to bottom on conversation change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationId]);

  const handleTimelineChange = (date: Date) => {
    // Find the first message on or after this date
    const targetMessage = filteredMessages.find(msg => {
      const msgDate = parseISO(msg.Created.replace(' UTC', 'Z'));
      return msgDate >= date;
    });

    if (targetMessage && chatWindowRef.current) {
      const element = document.getElementById(`msg-${targetMessage['Created(microseconds)']}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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
        {groupedMessages.map(([date, messages]) => (
          <div key={date}>
            <div className="date-divider">
              <span>{date}</span>
            </div>
            {messages.map((msg, index) => {
              const mediaType = msg["Media Type"];
              const isSent = msg.IsSender;
              
              // Check message grouping
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
              
              const showSenderName = (
                !prevMsg || 
                prevMsg.From !== msg.From || 
                prevMsg.IsSender !== msg.IsSender
              );
              
              const isFirstInGroup = showSenderName;
              const isLastInGroup = (
                !nextMsg ||
                nextMsg.From !== msg.From ||
                nextMsg.IsSender !== msg.IsSender
              );
              
              const participantColor = getParticipantColor(msg.From);
              
              // Handle different media types
              if (mediaType === 'STATUSERASEDSNAPMESSAGE' || mediaType === 'STATUSERASEDMESSAGE') {
                return (
                  <div key={msg['Created(microseconds)']} className="system-message">
                    <Trash2 size={14} />
                    <span>{isSent ? 'You' : displayName} deleted a {mediaType === 'STATUSERASEDSNAPMESSAGE' ? 'snap' : 'message'}</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              if (mediaType === 'STATUSPARTICIPANTREMOVED') {
                return (
                  <div key={msg['Created(microseconds)']} className="system-message">
                    <UserMinus size={14} />
                    <span>Participant removed</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              if (mediaType === 'STATUSPARTICIPANTJOINED') {
                return (
                  <div key={msg['Created(microseconds)']} className="system-message">
                    <UserPlus size={14} />
                    <span>{isSent ? 'You' : displayName} joined the chat</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              if (mediaType === 'STATUSCONVERSATIONCAPTURESCREENSHOT') {
                return (
                  <div key={msg['Created(microseconds)']} className="system-message screenshot">
                    <Camera size={14} />
                    <span>{isSent ? 'You' : displayName} took a screenshot</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              if (mediaType === 'STATUSSAVETOCAMERAROLL') {
                return (
                  <div key={msg['Created(microseconds)']} className="system-message">
                    <Save size={14} />
                    <span>{isSent ? 'You' : displayName} saved to camera roll</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              if (mediaType === 'STATUSMESSAGESAVED' || mediaType === 'STATUSMESSAGESCREENSHOTTED') {
                const action = mediaType === 'STATUSMESSAGESAVED' ? 'saved' : 'screenshotted';
                const icon = mediaType === 'STATUSMESSAGESAVED' ? <Save size={14} /> : <Camera size={14} />;
                return (
                  <div key={msg['Created(microseconds)']} className={`system-message ${mediaType === 'STATUSMESSAGESCREENSHOTTED' ? 'screenshot' : ''}`}>
                    {icon}
                    <span>{isSent ? 'You' : displayName} {action} a message</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              if (mediaType === 'STATUSONGOINGCALL') {
                return (
                  <div key={msg['Created(microseconds)']} className="system-message ongoing-call">
                    <Phone size={14} className="pulse" />
                    <span>Call in progress</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              // Handle call-related messages
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
                  <div key={msg['Created(microseconds)']} className="call-message">
                    {callIcons[mediaType]}
                    <span>{callText}</span>
                    <span className="call-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              // Handle media messages
              if (mediaType === 'MEDIA') {
                return (
                  <div key={msg['Created(microseconds)']} className={`media-message ${isSent ? 'sent' : 'received'}`}>
                    <div className="media-bubble">
                      <Image size={16} className="media-icon" />
                      <span>Photo/Video</span>
                    </div>
                    <span className="media-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              // Handle stickers
              if (mediaType === 'STICKER' || mediaType === 'STICKERNOTE') {
                return (
                  <div key={msg['Created(microseconds)']} className={`sticker-message ${isSent ? 'sent' : 'received'}`}>
                    <div className="sticker-bubble">
                      <Sticker size={20} className="sticker-icon" />
                      {mediaType === 'STICKERNOTE' && msg.Content && (
                        <span className="sticker-note">{msg.Content}</span>
                      )}
                    </div>
                    <span className="sticker-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              // Handle shared content
              if (mediaType === 'SHARE' || mediaType === 'SHARESAVEDSTORY') {
                const shareType = mediaType === 'SHARESAVEDSTORY' ? 'Shared story' : 'Shared content';
                return (
                  <div key={msg['Created(microseconds)']} className={`share-message ${isSent ? 'sent' : 'received'}`}>
                    <div className="share-bubble">
                      <Share size={16} className="share-icon" />
                      <span>{shareType}</span>
                    </div>
                    <span className="share-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              // Handle location reactions
              if (mediaType === 'MAPREACTION') {
                return (
                  <div key={msg['Created(microseconds)']} className="system-message">
                    <span>📍 {isSent ? 'You' : displayName} reacted to location</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              // Handle bot responses
              if (mediaType === 'NONPARTICIPANTBOTRESPONSE') {
                return (
                  <div key={msg['Created(microseconds)']} className="bot-message">
                    <div className="bot-header">
                      <Bot size={14} />
                      <span>Bot Response</span>
                    </div>
                    <div className="bot-content">
                      {msg.Content || 'Bot message'}
                    </div>
                    <span className="bot-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              // Handle system tags
              if (mediaType === 'PLUSSYSTEMTAG') {
                return (
                  <div key={msg['Created(microseconds)']} className="system-message">
                    <Tag size={14} />
                    <span>System tag</span>
                    <span className="system-time">
                      {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'h:mm a')}
                    </span>
                  </div>
                );
              }
              
              // Handle voice notes (NOTE media type)
              if (mediaType === 'NOTE') {
                return (
                  <div
                    key={msg['Created(microseconds)']}
                    id={`msg-${msg['Created(microseconds)']}`}
                    className={`message voice-note ${isSent ? 'sent' : 'received'} ${isGroupChat ? 'group-chat' : ''} ${showSenderName ? 'show-sender' : 'grouped'} ${isFirstInGroup ? 'first-in-group' : ''} ${isLastInGroup ? 'last-in-group' : ''}`}
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
                        <div className="voice-note-bubble">
                          <Mic size={14} className="voice-note-icon" />
                          <span className="voice-note-text">Voice Note</span>
                        </div>
                      </div>
                      <div className="message-timestamp">
                        {format(parseISO(msg.Created.replace(' UTC', 'Z')), 'HH.mm')}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Regular messages
              return (
                <div
                  key={msg['Created(microseconds)']}
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
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
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

export default ChatWindow;