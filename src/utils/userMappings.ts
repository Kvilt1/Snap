import { ChatMessage, FriendsData, UsernameMappings } from '../types/snapchat'

// Get display name for a username, checking mappings first, then friends, then fallback
export function getDisplayName(
  username: string,
  friendsData: FriendsData,
  usernameMappings: UsernameMappings
): string {
  // Check manual mappings first
  if (usernameMappings[username]) {
    return usernameMappings[username].displayName
  }

  // Check friends list
  const friend = friendsData.Friends.find(f => f.Username === username)
  if (friend) {
    return friend["Display Name"]
  }

  // Fallback to username
  return username
}

// Check if a username is unknown (not in friends list and not manually mapped)
export function isUnknownUser(
  username: string,
  friendsData: FriendsData,
  usernameMappings: UsernameMappings
): boolean {
  // Check if manually mapped
  if (usernameMappings[username]) {
    return false
  }

  // Check if in friends list
  const friend = friendsData.Friends.find(f => f.Username === username)
  return !friend
}

// Get all unknown usernames from a conversation
export function getUnknownUsersInConversation(
  messages: ChatMessage[],
  friendsData: FriendsData,
  usernameMappings: UsernameMappings,
  currentUsername?: string
): string[] {
  const uniqueUsernames = new Set<string>()
  
  messages.forEach(msg => {
    // Skip messages from the current user
    if (msg.IsSender || (currentUsername && msg.From === currentUsername)) {
      return
    }
    
    if (isUnknownUser(msg.From, friendsData, usernameMappings)) {
      uniqueUsernames.add(msg.From)
    }
  })

  return Array.from(uniqueUsernames)
}

// Get count of unknown users in a conversation
export function getUnknownUserCount(
  messages: ChatMessage[],
  friendsData: FriendsData,
  usernameMappings: UsernameMappings,
  currentUsername?: string
): number {
  return getUnknownUsersInConversation(messages, friendsData, usernameMappings, currentUsername).length
}

// Check if a conversation has any unknown users
export function hasUnknownUsers(
  messages: ChatMessage[],
  friendsData: FriendsData,
  usernameMappings: UsernameMappings,
  currentUsername?: string
): boolean {
  return getUnknownUserCount(messages, friendsData, usernameMappings, currentUsername) > 0
}