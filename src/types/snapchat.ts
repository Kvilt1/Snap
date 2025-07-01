// Types for Snapchat JSON data structures

// chat_history.json types
export interface ChatMessage {
  From: string;
  "Media Type": string;
  Created: string; // "YYYY-MM-DD HH:MM:SS UTC"
  Content: string | null;
  "Conversation Title": string | null;
  IsSender: boolean;
  "Created(microseconds)": number;
  IsSaved: boolean;
  "Media IDs": string;
}

export interface ChatHistory {
  [username: string]: ChatMessage[];
}

// friends.json types
export interface FriendEntry {
  Username: string;
  "Display Name": string;
  "Creation Timestamp": string;
  "Last Modified Timestamp": string;
  Source: string;
}

export interface ShortcutEntry {
  "Shortcut Name": string;
  Created: string;
}

export interface FriendsData {
  Friends: FriendEntry[];
  "Friend Requests Sent": FriendEntry[];
  "Blocked Users": FriendEntry[];
  "Deleted Friends": FriendEntry[];
  "Hidden Friend Suggestions": FriendEntry[];
  "Ignored Snapchatters": FriendEntry[];
  "Pending Requests": FriendEntry[];
  Shortcuts: ShortcutEntry[];
}

// account.json types
export interface Account {
  "Basic Information": {
    Username: string;
    Name: string;
    "Creation Date": string;
    "Registration IP": string;
    Country: string;
    "Last Active": string;
  };
  "Device Information": {
    Make: string;
    "Model ID": string;
    "Model Name": string;
    Language: string;
    "OS Type": string;
    "OS Version": string;
    "Connection Type": string;
  };
  "Device History": Array<{
    Make: string;
    Model: string;
    "Start Time": string;
    "Device Type": string;
  }>;
  "Privacy Policy and Terms of Service Acceptance History": any[];
  "Custom Creative Tools Terms": any[];
  "Login History": Array<{
    IP: string;
    Country: string;
    Created: string;
    Status: string;
    Device: string;
  }>;
  "Family Center": any[];
}

// account_history.json types
export interface AccountHistory {
  "Display Name Change": any[];
  "Email Change": any[];
  "Mobile Number Change": any[];
  "Password Change": any[];
  "Snapchat Linked to Bitmoji": any[];
  Spectacles: any[];
  "Two-Factor Authentication": any[];
  "Account deactivated / reactivated": any[];
  "Download My Data Reports": Array<{
    Date: string;
    Status: string;
    "Email Address": string;
  }>;
}

// Username mapping types
export interface UsernameMapping {
  displayName: string;
  mappedToUsername: string;
  dateCreated: string;
}

export interface UsernameMappings {
  [username: string]: UsernameMapping;
}