# Chatviewer Claude Demo

A demo chat viewer application that displays Snapchat-style chat conversations. This React application showcases a modern chat interface with built-in sample data.

## Features

- **Interactive Chat Viewer** - Clean interface for viewing chat conversations
- **Chat Timeline Slider** - Visual navigation for chat histories
- **Dual Search** - Search within individual chats or globally across all conversations
- **Group Chat Support** - Automatic detection and color-coded messages for group conversations
- **Dark Theme** - Modern dark UI matching Snapchat's native appearance
- **Username Mapping** - Map unknown usernames to display names

## Demo

Visit the live demo: [Coming soon on Netlify]

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chatviewer-claude.git
cd chatviewer-claude
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Deployment

### Netlify

This project is configured for easy Netlify deployment:

1. Fork this repository
2. Connect your GitHub account to Netlify
3. Import the project
4. Deploy automatically on every push

### Manual Deployment

Upload the contents of the `dist` folder to any static hosting service.

## About This Demo

This is a **demo application** with built-in sample data. It demonstrates:
- Individual and group chat conversations
- Various message types (text, calls, system messages)
- User interface for browsing chat history
- Search functionality across conversations

The app uses mock data to showcase the chat viewing experience without requiring actual Snapchat export files.

## Development

### Tech Stack

- React 19.1.0
- TypeScript
- Vite 7.0.0
- CSS Modules
- Lucide React (icons)
- date-fns

### Project Structure

```
src/
├── components/     # React components
├── data/          # Mock data
├── hooks/         # Custom React hooks
├── styles/        # Component CSS files
├── types/         # TypeScript interfaces
├── utils/         # Utility functions
└── App.tsx        # Main application
```

### Key Components

- **Dashboard** - Landing page with navigation options
- **ConversationList** - Sidebar showing all available conversations
- **ChatWindow** - Main chat display area
- **TimelineSlider** - Navigation through message history
- **UsernameMappingModal** - Interface for mapping unknown usernames

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with React and TypeScript
- Icons by Lucide
- Inspired by Snapchat's UI/UX