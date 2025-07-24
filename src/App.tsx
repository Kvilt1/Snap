import { useState } from 'react'
import ConversationList from './components/ConversationList'
import ChatWindow from './components/ChatWindow'
import Dashboard from './components/Dashboard'
import { UsernameMappings } from './types/snapchat'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { ArrowLeft } from 'lucide-react'
import { mockChatHistory, mockFriendsData, mockAccountData } from './data/mockData'
import './styles/App.css'

function App() {
  // Initialize with mock data
  const chatHistory = mockChatHistory
  const friendsData = mockFriendsData
  const accountData = mockAccountData
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat'>('dashboard')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const debouncedGlobalSearchQuery = useDebouncedValue(globalSearchQuery, 300)
  const [usernameMappings, setUsernameMappings] = useState<UsernameMappings>(() => {
    // Load existing mappings from localStorage
    const saved = localStorage.getItem('snapchat-username-mappings')
    return saved ? JSON.parse(saved) : {}
  })

  // Save mappings to localStorage
  const updateUsernameMappings = (newMappings: UsernameMappings) => {
    setUsernameMappings(newMappings)
    localStorage.setItem('snapchat-username-mappings', JSON.stringify(newMappings))
  }

  const handleNavigateToChat = () => {
    setCurrentView('chat')
  }

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedConversation(null)
  }

  if (currentView === 'dashboard') {
    return (
      <div className="app">
        <Dashboard 
          onNavigateToChat={handleNavigateToChat}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-content">
          <button
            onClick={handleNavigateToDashboard}
            className="back-button"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          <h1>Snapchat Archive Viewer Demo</h1>
        </div>
        <input
          type="text"
          placeholder="Search all conversations..."
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
          className="global-search"
        />
      </div>
      <div className="app-content">
        <ConversationList
          chatHistory={chatHistory}
          friendsData={friendsData}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          searchQuery={debouncedGlobalSearchQuery}
          usernameMappings={usernameMappings}
        />
        {selectedConversation && (
          <ChatWindow
            conversation={chatHistory[selectedConversation]}
            conversationId={selectedConversation}
            friendsData={friendsData}
            usernameMappings={usernameMappings}
            onUpdateMappings={(mappings) => updateUsernameMappings(mappings)}
          />
        )}
      </div>
    </div>
  )
}

export default App