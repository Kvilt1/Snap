Core Feature: The Chat Viewer (Archive Viewer)
This is the main feature of the application, serving as a dedicated archive viewer for your chat history. It's important to clarify that this is a read-only experience; you cannot send messages, make calls, or interact with your contacts in any way.
 * Data to Use: We'll primarily use chat_history.json. We will also leverage friends.json to display friends' real names instead of just their usernames, and account.json to correctly identify which messages are yours.
 * How it will be Displayed:
   * Conversation List: A sidebar on the left will list all your conversations. Each item will show the other person's name, giving you a clear overview of your chat history.
   * Chat Window: When you select a conversation, the main area of the screen will display the entire chat history in a familiar, modern interface. Your messages will be aligned to the right, and the other person's to the left, for easy reading.
   * Message Bubbles: Each message will appear in a "bubble," clearly showing the content and the exact timestamp of when it was sent.
Styling and User Interface
To make the archive viewer feel like a polished application, we will focus on a clean and intuitive visual style:
 * Theme: A dark theme, similar to Snapchat's native look, will be implemented for a comfortable viewing experience, especially in low-light conditions.
 * Fonts and Colors: We will use a modern, easy-to-read font and a simple, consistent color scheme.
 * Layout: A standard and effective two-column layout will be used, with the sidebar for conversation navigation and the main area for viewing the selected chat.
1. The "Throwback Machine" (Archive Viewer)
This feature is designed to let you relive your memories by transporting you back to a specific date. It functions as a comprehensive archive viewer, showing you a complete snapshot of your chat interface as it appeared on that day.
 * How it will work:
   * Date Selector: A calendar or date input field will be added to the main interface, allowing you to select any date from your chat history.
   * Archive Display: When you select a date, the "Throwback Machine" will not just show you a list of entries. Instead, it will display the entire chat viewer as it was on that specific date. This means the conversation list and the chat windows will only contain messages and interactions up to and including the chosen date.
   * Data Filtering: The application will filter all data to create this historical view:
     * Chats: It will process chat_history.json to display only messages with a "Created" timestamp that falls on or before the selected date.
     * Friends: By analyzing friends.json (assuming it includes a timestamp for when each friendship began), the viewer will filter your friends list to show only those you were friends with at that time.
     * Your Profile: It will use account_history.json to retrieve and display your profile information, such as your display name, as it was on that specific date.
   * Read-Only Experience: The entire application will refresh to show this snapshot of your past. Crucially, all interactive functions like messaging and calling will be disabled to make it clear that this is an archive viewer, not a live chat.
2. The Chat Timeline Slider
This feature will make navigating through long chat histories effortless.
 * How it will work:
   * Slider UI: A slider will appear at the top or bottom of the screen when you open a chat.
   * Date Mapping: The slider will represent the entire timeline of the conversation, with the beginning marking the very first message and the end representing the most recent one.
   * Real-time Scrolling: As you drag the slider, the chat window will instantly scroll to the messages sent on the corresponding date.
   * Date Picker: A date picker will be included next to the slider, allowing you to jump to a specific date within the chat. The slider will then automatically move to the correct position.
3. Dual Search Bars
Finding specific messages or conversations will be quick and efficient with two distinct search functions.
 * How it will work:
   * In-Chat Search: A search bar within each chat window will allow you to filter messages in real-time, showing only those that contain your search term.
   * Global Search: A separate, more prominent search bar on the main screen will search across all your conversations in chat_history.json. The results will be displayed as a list of messages; clicking a result will take you to that exact point in the corresponding chat.
4. Integrating Display Names with friends.json
To make the viewer more personal and user-friendly, we will replace usernames with display names wherever possible.
 * How it will work:
   * Data Mapping: We will first process friends.json to create a map linking usernames to their display names.
   * Dynamic Replacement: Throughout the application—in both the conversation list and within chat windows—usernames will be dynamically replaced with their corresponding display names. If a person is no longer on your friends list, their username will be displayed as a fallback.
JSON Files for the MVP
Based on these feature descriptions, the following JSON files will be essential for the Minimum Viable Product:
 * chat_history.json: The core data for all chat-related features.
 * friends.json: Used to retrieve the display names of your friends.
 * account.json: To identify you as the user in chats.
 * account_history.json: For the "Throwback Machine" to access your historical profile data.
