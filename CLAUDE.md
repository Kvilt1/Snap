# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chatviewer-claude is a **read-only archive viewer** for Snapchat chat history. This is currently a greenfield project with specifications defined in `mvp.md` but no implementation yet.

## Core Features to Implement

1. **Chat Viewer** - Main interface for viewing archived conversations
2. **Throwback Machine** - Time travel feature to view chats as they appeared on specific dates
3. **Chat Timeline Slider** - Visual navigation for long chat histories
4. **Dual Search** - In-chat and global search functionality

## Expected Data Structure

The application will process exported Snapchat JSON files:
- `chat_history.json` - Core message data
- `friends.json` - Friend list with display names
- `account.json` - User account information
- `account_history.json` - Historical profile data

## Architecture Considerations

When implementing this project, consider:

1. **Frontend-Only Application** - No backend requirements specified
2. **JSON Processing** - Need efficient parsing and filtering of potentially large JSON files
3. **Date-Based Filtering** - Critical for Throwback Machine feature
4. **Search Indexing** - Required for dual search functionality
5. **Dark Theme UI** - Should match Snapchat's native appearance

## Development Setup

The project is now built with React + TypeScript + Vite. To get started:

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`
4. Preview production build: `npm run preview`

Sample JSON files are available in the `/data` directory for testing.

## Key Implementation Notes

- This is a **read-only viewer** - no interactive messaging features
- Display names from `friends.json` should replace usernames throughout the UI
- The Throwback Machine requires filtering all data to show historical state
- Search should work both within individual chats and globally across all conversations
- Consider performance implications when handling large chat histories

### Message Type Handling

The application filters and displays different Snapchat message types as follows:

**Hidden Types** (not displayed):
- `MEDIA`, `STATUS`, `STICKER`
- Empty `TEXT` messages

**Special Display Types**:
- `STATUSERASEDSNAPMESSAGE` → "User deleted a chat" (system message style)
- `STATUSPARTICIPANTREMOVED` → "Participant removed" (system message style)
- `STATUSCALLENDEDAUDIO` → Phone icon + "Voice call ended"
- `STATUSCALLENDEDVIDEO` → Video icon + "Video call ended" 
- `STATUSCALLMISSEDAUDIO` → Phone-off icon + "Missed voice call"
- `STATUSCALLMISSEDVIDEO` → Video-off icon + "Missed video call"
- `TEXT` → Display content only if not empty

### Group Chat Support

The application automatically detects and handles group chats:

**Detection**: Group chats are identified by:
- Non-null `Conversation Title` field
- UUID keys instead of usernames
- Multiple unique participants in message history

**Features**:
- Group chat names display the `Conversation Title`
- Participant count shown in conversation list (👥 4) and chat header
- Sender names displayed above each received message in group chats
- Visual distinction with group chat styling
- **Color-coded message bubbles**: Each participant gets a unique color in group chats
- **Message grouping**: Consecutive messages from same user show username only once

### Message Layout & Colors

**Design**: Clean, minimal layout inspired by modern chat interfaces
- Left-aligned sender names with participant colors
- **Continuous colored bars** for visual message grouping
- Timestamps displayed in HH.mm format on the right
- No background bubbles for cleaner appearance

**Individual Chats**: Clean two-person conversation layout
- **"Me" messages**: Red color (#ff4757) with "Me" as sender name  
- **Friend messages**: Bright blue color (#3498db) with friend's display name
- **High contrast**: Red vs blue provides clear visual distinction between speakers
- **Message grouping**: Consecutive messages from same person hide redundant names
- **Continuous bars**: Multiple consecutive messages appear as one unbroken colored bar
- **Visual consistency**: Same colored bar system as group chats

**Group Chats**: Multi-participant color-coded hierarchy
- **Sender names**: Colored by participant (consistent throughout conversation)
- **Continuous colored bars**: 3px wide bars that extend across grouped messages
- **"Me" messages**: Red color (#ff4757) with "Me" as sender name
- **Received messages**: Unique color per participant (15 color palette)
- **Message grouping**: Consecutive messages from same user hide redundant names
- **Visual flow**: Unbroken colored bars clearly show message threads from each participant

### Message Ordering

**Chat Messages**: Displayed chronologically (oldest at top, newest at bottom)
- Auto-scrolls to latest messages when opening a conversation
- Timeline slider allows navigation through message history

**Conversation List**: Sorted by latest message date (most recent conversations first)
- Consistent filtering applied to determine actual last visible message
- Honors throwback date filtering for historical views

## Testing Approach

When tests are implemented:
- Unit test JSON parsing and filtering logic
- Test date-based filtering for Throwback Machine
- Test search functionality with various edge cases
- UI component testing for chat bubbles and navigation