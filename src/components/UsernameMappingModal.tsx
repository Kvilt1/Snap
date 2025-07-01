import { useState, useMemo } from 'react'
import { Search, X, User, Users } from 'lucide-react'
import { FriendsData, UsernameMappings, UsernameMapping } from '../types/snapchat'
import '../styles/UsernameMappingModal.css'

interface UsernameMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  unmappedUsernames: string[];
  friendsData: FriendsData;
  currentMappings: UsernameMappings;
  onSaveMappings: (mappings: UsernameMappings, friendsToUpdate?: {[oldUsername: string]: string}) => void;
}

function UsernameMappingModal({
  isOpen,
  onClose,
  unmappedUsernames,
  friendsData,
  currentMappings,
  onSaveMappings
}: UsernameMappingModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [tempMappings, setTempMappings] = useState<{ [username: string]: string }>({})
  const [friendsToUpdate, setFriendsToUpdate] = useState<{ [oldUsername: string]: string }>({})

  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friendsData.Friends
    
    return friendsData.Friends.filter(friend => 
      friend["Display Name"].toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.Username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [friendsData.Friends, searchQuery])

  // Handle mapping a username to a friend
  const handleMapUsername = (username: string, friendUsername: string, friendDisplayName: string) => {
    setTempMappings(prev => ({
      ...prev,
      [username]: friendDisplayName
    }))
    
    // Track which friend needs their username updated
    setFriendsToUpdate(prev => ({
      ...prev,
      [username]: friendUsername
    }))
  }

  // Handle removing a mapping
  const handleRemoveMapping = (username: string) => {
    setTempMappings(prev => {
      const newMappings = { ...prev }
      delete newMappings[username]
      return newMappings
    })
    
    setFriendsToUpdate(prev => {
      const newFriendsToUpdate = { ...prev }
      delete newFriendsToUpdate[username]
      return newFriendsToUpdate
    })
  }

  // Save all mappings and close modal
  const handleSave = () => {
    const newMappings: UsernameMappings = { ...currentMappings }
    
    Object.entries(tempMappings).forEach(([username, displayName]) => {
      const friend = friendsData.Friends.find(f => f["Display Name"] === displayName)
      if (friend) {
        newMappings[username] = {
          displayName,
          mappedToUsername: friend.Username,
          dateCreated: new Date().toISOString()
        }
      }
    })

    onSaveMappings(newMappings, friendsToUpdate)
    setTempMappings({})
    setFriendsToUpdate({})
    onClose()
  }

  // Reset and close
  const handleCancel = () => {
    setTempMappings({})
    setFriendsToUpdate({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="mapping-modal">
        <div className="modal-header">
          <h2>
            <Users size={20} />
            Map Unknown Users
          </h2>
          <button onClick={handleCancel} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="unmapped-users">
            <h3>Unknown Users ({unmappedUsernames.length})</h3>
            <div className="unmapped-list">
              {unmappedUsernames.map(username => (
                <div key={username} className="unmapped-user">
                  <div className="username-display">
                    <User size={16} />
                    <span>{username}</span>
                  </div>
                  {tempMappings[username] ? (
                    <div className="mapped-to">
                      <span>→ {tempMappings[username]}</span>
                      <button 
                        onClick={() => handleRemoveMapping(username)}
                        className="remove-mapping"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="not-mapped">Not mapped</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="friends-section">
            <h3>Select from Friends</h3>
            <div className="search-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="friend-search"
              />
            </div>

            <div className="friends-list">
              {filteredFriends.map(friend => (
                <div key={friend.Username} className="friend-item">
                  <div className="friend-info">
                    <div className="friend-name">{friend["Display Name"]}</div>
                    <div className="friend-username">@{friend.Username}</div>
                  </div>
                  <div className="friend-actions">
                    {unmappedUsernames.map(username => (
                      <button
                        key={username}
                        onClick={() => handleMapUsername(username, friend.Username, friend["Display Name"])}
                        className={`map-button ${tempMappings[username] === friend["Display Name"] ? 'selected' : ''}`}
                        disabled={!!(tempMappings[username] && tempMappings[username] !== friend["Display Name"])}
                      >
                        {username}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="save-button"
            disabled={Object.keys(tempMappings).length === 0}
          >
            Save Mappings ({Object.keys(tempMappings).length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default UsernameMappingModal