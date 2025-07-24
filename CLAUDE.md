# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chatviewer-claude is a **demo chat viewer** for displaying Snapchat-style chat conversations. This is a client-side only React application that uses built-in mock data to demonstrate the chat viewing interface.

## Tech Stack

- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 7.0.0
- **Styling**: Component-specific CSS files (no CSS-in-JS)
- **Icons**: Lucide React
- **Date Handling**: date-fns 4.1.0
- **Deployment**: Netlify with SPA configuration

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # TypeScript check + production build
npm run preview      # Preview production build
npm run lint         # TypeScript type checking (no emit)
```

## Project Structure

```
src/
├── components/        # React components
│   ├── ChatWindow.tsx
│   ├── ConversationList.tsx
│   ├── Dashboard.tsx
│   ├── TimelineSlider.tsx
│   └── UsernameMappingModal.tsx
├── data/             # Mock data
│   └── mockData.ts
├── hooks/            # Custom React hooks
│   └── useDebouncedValue.ts
├── styles/           # Component-specific CSS files
├── types/            # TypeScript type definitions
│   └── snapchat.ts
├── utils/            # Utility functions
│   ├── searchIndex.ts
│   └── userMappings.ts
├── App.tsx           # Main application component
└── main.tsx          # Entry point
```

## Core Features

1. **Chat Viewer** - Main interface for viewing chat conversations
   - Two-column layout: conversation list sidebar + main chat area
   - Auto-scroll to latest messages when opening conversation
   
2. **Chat Timeline Slider** - Visual navigation for long chat histories
   - Positioned at top or bottom of screen
   - Updates message view in real-time

3. **Dual Search** - In-chat and global search functionality
   - **In-chat**: Real-time filtering within current conversation
   - **Global**: Searches all conversations, displays clickable message list

## Mock Data Structure

The application uses pre-built mock data (found in `src/data/mockData.ts`) that includes:
- Sample individual conversations
- A group chat example
- Various message types (text, calls, system messages)
- Sample friends data with display names
- Mock account information

## Message Handling

### Hidden Message Types
- `MEDIA`, `STATUS`, `STICKER`
- Empty `TEXT` messages

### Special Display Types
- `STATUSERASEDSNAPMESSAGE` → "User deleted a chat" (system style)
- `STATUSPARTICIPANTREMOVED` → "Participant removed" (system style)
- `STATUSCALLENDEDAUDIO` → 📞 "Voice call ended"
- `STATUSCALLENDEDVIDEO` → 📹 "Video call ended"
- `STATUSCALLMISSEDAUDIO` → 📵 "Missed voice call"
- `STATUSCALLMISSEDVIDEO` → 📹 "Missed video call"
- `TEXT` → Display content only if not empty

## Group Chat Support

### Detection
- Non-null `Conversation Title` field
- UUID keys instead of usernames
- Multiple unique participants in message history

### Features
- Display `Conversation Title` as chat name
- Show participant count (👥 4) in list and header
- Color-coded messages per participant (15 color palette)
- Sender names above messages (grouped for consecutive messages)
- Continuous colored bars for visual message grouping

## Message Design

### Individual Chats
- **"Me" messages**: Red (#ff4757) with "Me" label
- **Friend messages**: Blue (#3498db) with friend's display name
- Consecutive messages show continuous colored bar
- Timestamps in HH.mm format on right

### Group Chats
- Each participant gets unique color (consistent throughout chat)
- 3px colored bars extend across grouped messages
- "Me" always red (#ff4757)
- Sender names colored to match message bar

### Message Ordering
- **Chat Messages**: Chronological (oldest top, newest bottom)
- **Conversation List**: By latest message date (newest first)

## Username Mapping

The app supports manual username mapping stored in localStorage. Users can map unknown usernames to display names through the UI.

## TypeScript Configuration

- Strict mode enabled
- Bundler module resolution
- ES2020 target
- Path aliases configured (@/ for src/)

## Deployment

- Configured for Netlify with netlify.toml
- SPA routing enabled
- Security headers configured
- Client-side only - no environment variables needed