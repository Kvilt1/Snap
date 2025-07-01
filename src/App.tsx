import { useState } from 'react'
import ConversationList from './components/ConversationList'
import ChatWindow from './components/ChatWindow'
import ThrowbackMachine from './components/ThrowbackMachine'
import { ChatHistory, FriendsData, Account, UsernameMappings } from './types/snapchat'
import { Download } from 'lucide-react'
import './styles/App.css'

function App() {
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null)
  const [friendsData, setFriendsData] = useState<FriendsData | null>(null)
  const [accountData, setAccountData] = useState<Account | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [throwbackDate, setThrowbackDate] = useState<Date | null>(null)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [loadingProgress, setLoadingProgress] = useState<string>('')
  const [usernameMappings, setUsernameMappings] = useState<UsernameMappings>(() => {
    // Load existing mappings from localStorage
    const saved = localStorage.getItem('snapchat-username-mappings')
    return saved ? JSON.parse(saved) : {}
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [updatedFriendsData, setUpdatedFriendsData] = useState<FriendsData | null>(null)

  // Save mappings to localStorage and prepare friends data for export
  const updateUsernameMappings = (newMappings: UsernameMappings, mappingsToApply?: {[oldUsername: string]: string}) => {
    setUsernameMappings(newMappings)
    localStorage.setItem('snapchat-username-mappings', JSON.stringify(newMappings))
    
    // If we have mappingsToApply, prepare the updated friends data
    if (mappingsToApply && friendsData) {
      const newFriendsData = { ...friendsData }
      
      Object.entries(mappingsToApply).forEach(([oldUsername, friendUsername]) => {
        // Find the friend to update
        const friendIndex = newFriendsData.Friends.findIndex(f => f.Username === friendUsername)
        if (friendIndex !== -1) {
          // Update the username in friends data
          newFriendsData.Friends[friendIndex].Username = oldUsername
        }
      })
      
      setFriendsData(newFriendsData)
      setUpdatedFriendsData(newFriendsData)
      setHasUnsavedChanges(true)
    }
  }

  // Handle manual export of updated friends.json file
  const handleExportFriendsFile = () => {
    if (!updatedFriendsData) return
    
    const dataStr = JSON.stringify(updatedFriendsData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'friends_updated.json'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Reset the unsaved changes flag after export
    setHasUnsavedChanges(false)
  }

  // Process JSON files from folder
  const processJsonFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.name.endsWith('.json')) continue
      
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        // Identify file type by name or content
        if (file.name.includes('chat_history')) {
          setChatHistory(data)
          setLoadingProgress(prev => prev + '\n✓ Loaded chat history')
        } else if (file.name.includes('friends')) {
          setFriendsData(data)
          setLoadingProgress(prev => prev + '\n✓ Loaded friends')
        } else if (file.name.includes('account') && !file.name.includes('history')) {
          setAccountData(data)
          setLoadingProgress(prev => prev + '\n✓ Loaded account')
        }
      } catch (error) {
        console.error(`Error parsing ${file.name}:`, error)
      }
    }
  }

  // Handle folder selection (for browsers that support it)
  const handleFolderSelect = async () => {
    try {
      setLoadingProgress('Selecting folder...')
      // @ts-ignore - File System Access API not in TypeScript yet
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker()
        const files: File[] = []
        
        // Look for json folder
        let jsonDir = null
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'directory' && entry.name === 'json') {
            jsonDir = entry
            break
          }
        }
        
        if (jsonDir) {
          setLoadingProgress('Found json folder, loading files...')
          for await (const entry of jsonDir.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
              const file = await entry.getFile()
              files.push(file)
            }
          }
        } else {
          // Try root folder
          for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
              const file = await entry.getFile()
              files.push(file)
            }
          }
        }
        
        await processJsonFiles(files)
      } else {
        // Fallback to file input
        document.getElementById('folder-input')?.click()
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error selecting folder:', error)
        setLoadingProgress('Error loading folder')
      }
    }
  }

  // Handle multiple file selection (fallback)
  const handleMultipleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    await processJsonFiles(files)
  }

  const isDataLoaded = chatHistory && friendsData && accountData

  if (!isDataLoaded) {
    return (
      <div className="app-loading">
        <h1>Chatviewer</h1>
        <p>Load your Snapchat data to begin</p>
        <div className="file-upload-container">
          <button 
            className="folder-upload-button"
            onClick={handleFolderSelect}
          >
            Select Snapchat JSON Folder
          </button>
          <input
            id="folder-input"
            type="file"
            multiple
            accept=".json"
            onChange={handleMultipleFiles}
            style={{ display: 'none' }}
          />
          <div className="upload-hint">
            <p>Select the folder containing:</p>
            <ul>
              <li>chat_history.json</li>
              <li>friends.json</li>
              <li>account.json</li>
            </ul>
          </div>
          {loadingProgress && (
            <div className="loading-status">
              <pre>{loadingProgress}</pre>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-content">
          <h1>Snapchat Archive Viewer</h1>
          <div className="header-actions">
            <ThrowbackMachine
              chatHistory={chatHistory}
              onDateSelect={setThrowbackDate}
            />
            {hasUnsavedChanges && (
              <button
                onClick={handleExportFriendsFile}
                className="export-button"
                title="Export updated friends.json with username mappings"
              >
                <Download size={16} />
                <span>Export Friends</span>
              </button>
            )}
          </div>
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
          throwbackDate={throwbackDate}
          searchQuery={globalSearchQuery}
          usernameMappings={usernameMappings}
        />
        {selectedConversation && (
          <ChatWindow
            conversation={chatHistory[selectedConversation]}
            conversationId={selectedConversation}
            friendsData={friendsData}
            throwbackDate={throwbackDate}
            usernameMappings={usernameMappings}
            onUpdateMappings={updateUsernameMappings}
          />
        )}
      </div>
    </div>
  )
}

export default App