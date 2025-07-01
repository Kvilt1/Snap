# Chatviewer Claude

A read-only archive viewer for Snapchat chat history. View your exported Snapchat conversations in a clean, modern interface with powerful search and time-travel features.

## Features

- **Chat Viewer** - Clean interface for viewing archived conversations
- **Throwback Machine** - Time travel to view chats as they appeared on specific dates
- **Chat Timeline Slider** - Visual navigation for long chat histories
- **Dual Search** - Search within individual chats or globally across all conversations
- **Group Chat Support** - Automatic detection and color-coded messages for group conversations
- **Dark Theme** - Modern dark UI matching Snapchat's native appearance

## Demo

Visit the live demo: [Coming soon on Netlify]

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Snapchat data export (JSON format)

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

4. Open your browser to `http://localhost:5173`

### Using Your Own Data

1. Export your Snapchat data from your account settings
2. Place the JSON files in a folder on your computer
3. Use the file upload feature in the app to load your data

The app processes these files:
- `chat_history.json` - Your message history
- `friends.json` - Friend display names
- `account.json` - Your account information
- `account_history.json` - Historical profile data

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

## Privacy

This is a **client-side only** application. Your chat data never leaves your device:
- No data is sent to any server
- All processing happens in your browser
- Your conversations remain completely private

## Development

### Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)

### Project Structure

```
src/
├── components/     # React components
├── types/         # TypeScript interfaces
├── utils/         # Utility functions
└── App.tsx        # Main application
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with React and TypeScript
- Icons by Lucide
- Inspired by Snapchat's UI/UX