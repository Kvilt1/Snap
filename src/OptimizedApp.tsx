import { useState, useCallback, useMemo } from 'react'
import { Upload, Calendar, Github, MessageSquare } from 'lucide-react'
import { UsernameMappings } from './types/snapchat'
import VirtualizedConversationList from './components/VirtualizedConversationList'
import VirtualizedChatWindow from './components/VirtualizedChatWindow'
import ThrowbackMachine from './components/ThrowbackMachine'
import PerformanceMonitor from './components/PerformanceMonitor'
import { useOptimizedData } from './hooks/useOptimizedData'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import './styles/App.css'

function OptimizedApp() {
  const {
    chatHistory,
    friendsData,
    accountData,
    accountHistoryData,
    loading,
    progress,
    error,
    conversationCount,
    totalMessageCount,
    loadFiles,
    loadDirectory
  } = useOptimizedData();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [showThrowback, setShowThrowback] = useState(false)
  const [throwbackDate, setThrowbackDate] = useState<Date | null>(null)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [usernameMappings, setUsernameMappings] = useState<UsernameMappings>({})
  
  // Debounce search query for better performance
  const debouncedSearchQuery = useDebouncedValue(globalSearchQuery, 300);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    await loadFiles(files)
  }, [loadFiles])

  const handleFolderSelect = useCallback(async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker()
        await loadDirectory(dirHandle)
      } else {
        alert('Folder selection is not supported in your browser. Please use the file upload instead.')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error selecting folder:', error)
        alert('Failed to select folder. Please try again.')
      }
    }
  }, [loadDirectory])

  const handleUpdateMappings = useCallback((mappings: UsernameMappings) => {
    setUsernameMappings(mappings)
  }, [])

  // Memoize selected conversation messages
  const selectedConversationMessages = useMemo(() => {
    if (!selectedConversation || !chatHistory) return null
    return chatHistory[selectedConversation] || null
  }, [selectedConversation, chatHistory])

  // Calculate loading progress
  const overallProgress = useMemo(() => {
    const progressValues = Object.values(progress)
    if (progressValues.length === 0) return 0
    return progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length
  }, [progress])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Snapchat Archive Viewer</h1>
          <div className="header-actions">
            <button
              className="throwback-toggle"
              onClick={() => setShowThrowback(!showThrowback)}
              title="Throwback Machine"
            >
              <Calendar size={20} />
              {throwbackDate && <span className="active-indicator" />}
            </button>
            <PerformanceMonitor 
              messageCount={totalMessageCount}
              conversationCount={conversationCount}
              isVisible={!!chatHistory}
            />
            <a
              href="https://github.com/yourusername/chatviewer-claude"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
              title="View on GitHub"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
        
        {chatHistory && (
          <div className="global-search">
            <input
              type="text"
              placeholder="Search all conversations..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
            />
          </div>
        )}
      </header>

      {showThrowback && (
        <ThrowbackMachine
          chatHistory={chatHistory || {}}
          onDateSelect={setThrowbackDate}
        />
      )}

      <main className="app-main">
        {!chatHistory ? (
          <div className="upload-container">
            <div className="upload-card">
              <Upload size={48} />
              <h2>Load Your Snapchat Data</h2>
              <p>Select your Snapchat data export folder or upload individual JSON files</p>
              
              {loading && (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <p>Loading files... {Math.round(overallProgress * 100)}%</p>
                  {Object.entries(progress).map(([file, prog]) => (
                    <div key={file} className="file-progress">
                      <span>{file}</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${prog * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  <p>Error: {error}</p>
                </div>
              )}
              
              <div className="upload-actions">
                {'showDirectoryPicker' in window && (
                  <button 
                    className="upload-button primary"
                    onClick={handleFolderSelect}
                    disabled={loading}
                  >
                    Select Folder
                  </button>
                )}
                <label className="upload-button">
                  Upload JSON Files
                  <input
                    type="file"
                    multiple
                    accept=".json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                </label>
              </div>
              
              <div className="sample-data-info">
                <p>Need sample data? Check the <code>/data</code> directory</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-container">
            <aside className="sidebar">
              {friendsData && (
                <VirtualizedConversationList
                  chatHistory={chatHistory}
                  friendsData={friendsData}
                  onSelectConversation={setSelectedConversation}
                  selectedConversation={selectedConversation}
                  globalSearchQuery={debouncedSearchQuery}
                  throwbackDate={throwbackDate}
                  usernameMappings={usernameMappings}
                />
              )}
              
              <div className="sidebar-stats">
                <div className="stat">
                  <span className="stat-value">{conversationCount}</span>
                  <span className="stat-label">Conversations</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{totalMessageCount.toLocaleString()}</span>
                  <span className="stat-label">Messages</span>
                </div>
              </div>
            </aside>
            
            <section className="chat-section">
              {selectedConversation && selectedConversationMessages && friendsData ? (
                <VirtualizedChatWindow
                  conversation={selectedConversationMessages}
                  conversationId={selectedConversation}
                  friendsData={friendsData}
                  throwbackDate={throwbackDate}
                  usernameMappings={usernameMappings}
                  onUpdateMappings={handleUpdateMappings}
                />
              ) : (
                <div className="no-selection">
                  <MessageSquare size={48} />
                  <p>Select a conversation to start viewing</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default OptimizedApp