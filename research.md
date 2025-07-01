# Snapchat Data Download: Content and Structure

Snapchat’s official “My Data” download provides a comprehensive archive of your account information and activity. The data comes as a ZIP file containing both **JSON files** (raw data) and corresponding **HTML files** (formatted for easy reading) for various categories. Below we outline all the data included in a typical Snapchat data dump, clarify JSON vs HTML content, explain how media files link to chats, and list key fields (with their possible values) for each JSON file.

-----

## JSON vs. HTML Data Files

Snapchat allows you to export your data in JSON or HTML format (or both). The **JSON files** contain the raw structured data, while the **HTML files** present the same information in a human-readable table format. Importantly, **the HTML files do not include any additional data beyond what’s in the JSON** – they are simply an organized view. For example, your data export includes an `index.html` that serves as a homepage for Browse the data, and separate HTML pages for chat history, snap history, etc., each mirroring the content of the corresponding JSON file. Whether you choose JSON or HTML, the underlying information is the same (Snapchat even notes you can open the index HTML for an “organized view” or inspect the JSON directly for analysis). The HTML versions might embed or link to media (images/videos) for convenience, but they do not provide extra metadata not found in JSON.

-----

## Linking Media Files to Chats

If you request your Memories, Chat Media, and Stories in the export, the ZIP will include a folder (often named **`chat_media`**) containing image and video files from your chats. Each media file is named with a timestamp and a unique identifier. In the **`chat_history.json`**, saved messages that had photo/video attachments include a field for **“Media IDs”** – this string identifier corresponds to the filename of the actual media in the `chat_media` folder. For example, a chat message in the JSON might have `"Media IDs": "b~EigSFWFYRmhrc1dlY2Z..."` and a `chat_media` file named `2025-02-24_b~EigSFWFYRmhrc1dlY2Z....mp4`. The date prefix in the filename (here “2025-02-24”) matches the message’s date. **In short, you can match a media file to a chat entry by the unique ID.** The JSON’s “Media IDs” value (or values, if multiple media were sent at once) will appear in the media file’s name. This allows you to link each image/video file to the exact chat message it was sent in. (Note that `snap_history.json` – which logs Snap images/videos sent outside of chat – does **not** contain media IDs or actual media, since those Snaps are not saved by default.)

-----

## Data Categories and JSON Files in a Snapchat Export

Snapchat’s data download spans a wide range of account data. According to Snapchat Support, the archive will include data on **account history, profile information, friends, login history, snap and chat history, memories, purchase history, app interactions, location, search history, Bitmoji, and more**. Below is a breakdown of the key JSON files you’ll find, with an explanation of the content in each and the important fields. For fields that can take on a fixed set of values (e.g. types or categories), we list the possible values.

### Account and Profile Information

  * **`account.json`**: Basic account info such as your username, display name, birthday, phone, email, creation date, etc. (This is your static profile data.)
  * **`account_history.json`**: A log of account-related events. This can include the date your account was created and changes to account settings or information. It often also contains **login history** (dates, times, and possibly IP/device of logins). For example, login timestamps and IP addresses may be recorded here (Snapchat lists “Login History and Account information” together in the data categories). Typical entries might indicate when the account was created, when terms of service were accepted, or when you logged in from a new device. (Possible field values: Events might be labeled like “Account Created” or “Password Changed,” etc., with corresponding timestamps.)
  * **`user_profile.json`**: Additional profile details. This can include your Snap **display name and username**, Snap ID, account creation timestamp, and possibly your **Snap Score** and **Bitmoji avatar details**. It may also list counts of friends or other profile stats. (No complex enumerations here – mostly factual data specific to your profile.)

### Friends and Connections

  * **`friends.json`**: Your Snapchat friends list (the people you’ve added and who have added you). Each entry typically includes the friend’s username and display name, plus metadata about the friendship.
      * **“Direction”**: This indicates who added whom, often recorded as “OUTGOING” or “INCOMING” for each friend. An “OUTGOING” friend means you sent the friend request, whereas “INCOMING” means they added you first (and you accepted). Snapchat’s internal data includes timestamps for when you added them and when (if ever) they added you back. In fact, the data shows an `addedTimestamp` (when you added them) and a `reverseAddedTimestamp` (when they added you) for each friend. For mutual friends, both timestamps will be present; for someone who never added you back (one-way follow), one of these might be null. (Thus, “Direction” can effectively be derived: if your addedTimestamp is present but reverseAddedTimestamp is null, it was outgoing-only; if vice versa, they added you.)
      * **Added Date**: The date/time you became friends (usually corresponds to one of the above timestamps, often the earlier). Not an enumeration, just a timestamp.
      * **Friend Emojis**: Snapchat assigns “friend emojis” based on your interaction (e.g. best friends, Snapstreak flame emoji, etc.). These emoji statuses for each friend might be listed (or their codes) in the data, though they can be user-specific. (Possible values: various emoji like “🔥” for streak, “💕” for super BFF, etc., if included).
      * **Example**: Each friend entry will have their `username`, `display name`, and timestamps. For instance, Team Snapchat (which everyone has as a friend) will have an added timestamp that often equals your account creation date. If you see that entry, it’s a clue to when your account was made.
  * **`subscriptions.json`**: A list of **subscriptions** your account has. These are the public stories or content creators/publishers you follow in the Discover section. Entries might include the name of the subscribed channel or public figure and possibly an ID or type. (Possible fields: “Subscription Name” and maybe a category like “Publisher” vs “Creator”, though Snapchat typically just lists the title. No special enumerations beyond the names of subscriptions.)
  * **`connected_apps.json`**: A list of third-party apps connected to your Snapchat (via login kits or Bitmoji kit). If you have allowed any external apps access, they would appear here. Fields might include the app name and authorization date. If none, this will be essentially empty. (No variable values except app names.)
  * **`community_lenses.json`**: Likely records any Community Lenses you’ve created or submitted (via Lens Studio), or possibly lenses you’ve favorited. If you’ve never made a public lens, this might be empty. Fields could include lens identifiers or titles. (Possible values would be lens names/IDs; no fixed categories except presence or absence of data.)

### Chat History (`chat_history.json`)

This file contains the **content of saved chats** (messages) from your individual and group conversations. **Un-saved messages that have expired will not appear, but anything you or the other party saved will be listed**. Each entry represents one chat message or event. Key fields include:

  * **“From”**: The username of the sender of the message. (This could be you or a friend’s username.)
  * **“Conversation Title”**: The title of the conversation. This is typically the group chat name for group chats, or `null` for one-on-one chats (since one-on-one chats don’t have a special title beyond the friend’s name).
  * **“Created”**: The timestamp when the message was sent (in UTC). There is often also a `"Created(microseconds)"` or similar field giving a Unix epoch with microsecond precision.
  * **“IsSender”**: A boolean (`true`/`false`) indicating if the message was sent by you. (`True` means you sent it; `false` means it was sent by the other person.)
  * **“IsSaved”**: A boolean indicating if the message was saved (`true` if it was saved in chat, which is why it appears in this history). All entries in `chat_history` should be saved messages (so this might often be `true` or sometimes both parties have it saved). If a message was saved by either side, it appears here.
  * **“Content”/“Text”**: The text content of the message, if it was a text message. In the raw JSON, Snapchat sometimes uses `"Content": "...", "Media Type": "TEXT"` or in newer exports `"Text": "..."` after processing. If the message was a text chat, the content string will contain the message text. If the message was not text (e.g. a photo), this may be `null`.
  * **“Media Type”**: Type of message. This field tells you whether the message was textual or some kind of media. It can have **two main values: `"TEXT"`** for text messages, or **`"MEDIA"`** for any message that included media (such as a photo, video, or even things like stickers/Bitmoji). Snapchat confirms that media type will be either MEDIA or TEXT. (Note: Snapchat does not use separate types like “IMAGE” or “VIDEO” here for chat messages – all non-text attachments in chats are categorized under the generic “MEDIA”. Thus, a photo, a video, or an audio note in chat would all show `"Media Type": "MEDIA"` in `chat_history`.)
  * **Calls**: Snapchat voice/video calls, if they were logged, usually appear as system messages in the chat (e.g. “You missed a call from X”). If those were saved, they might appear as a chat entry with `"Media Type": "TEXT"` (since the call notification is treated like a text string in chat). There isn’t a distinct “CALL” type in the JSON; a call event would likely show up as a text note (or potentially not at all if not saved). In addition, Snapchat has a separate `talk_history.json` for call metadata (see **Talk History** below).
  * **“Media IDs”**: If `"Media Type"` is `MEDIA`, this field appears and contains an identifier (or multiple identifiers) for the attached media file(s). These IDs correspond to file names in the `chat_media` folder as described earlier. For example, an entry might look like:
    ```json
    {
      "From": "friendUsername",
      "Media Type": "MEDIA",
      "Created": "2025-02-24 21:09:09 UTC",
      "Content": null,
      "IsSender": false,
      "IsSaved": true,
      "Media IDs": "b~EigSFWFYRmhrc1dlY2ZLeVhSZU9aNkRnMTICBH1IAlAfWgUIwNu4AWAB"
    }
    ```
    This indicates a saved photo/video was received from that friend at that time. The actual media file would be named with a date and that ID (e.g. `2025-02-24_b~EigSFWFYRmhrc1....jpg/mp4`). If multiple media were sent in one message (e.g. a Snap with overlays), Snapchat might list multiple IDs (perhaps as an array or comma-separated string). In most cases it’s one ID per message.

In summary, **`chat_history.json`** provides a log of saved chats with who sent it, when, the content if text, and flags for saved/sender. **Media Type** here is either `TEXT` or `MEDIA`, and if `MEDIA`, you use the Media ID to find the actual photo/video file in the export.

### Snap History (`snap_history.json`)

This file logs the **Snaps (disappearing photo/video snaps)** you have recently sent or received. Snapchat typically only retains the last \~30 days of snap metadata (and only for snaps that were unopened or otherwise still on the server). Additionally, once a Snap is opened and expires, its content isn’t included – the data is mostly metadata (timestamps and sender/recipient info). The JSON is divided into two sections: **`"Received Snap History"`** and **`"Sent Snap History"`**, each an array of snap records.

Each Snap record has fields:

  * **“From”**: (in Received section) the username of the friend who sent you the Snap.
  * **“To”**: (in Sent section) the username of the friend you sent a Snap to.
  * **“Created”**: Timestamp when the Snap was sent.
  * **“Media Type”**: The type of Snap: **`"IMAGE"` or `"VIDEO"`**. This denotes whether the Snap was a photo or a video snap. (If it were a video Snap without audio vs with audio, the data does not explicitly differentiate – it will still just say `VIDEO`.) There is no separate ID for the media content here, and the actual image/video is **not** included in the export for snaps, since Snapchat does not keep opened snap content. The presence of a record means the snap existed, but you won’t get the media unless it was saved or a memory.
  * **(Possibly) “Status”**: In some cases, there might be an implicit status by virtue of whether it’s in “received” or “sent”. But the JSON might not explicitly say if a Snap was viewed or not. If a Snap is in the list, it was likely unopened at the time of data generation (or was sent by you). If a Snap expired or was opened long ago, it probably isn’t listed at all.

**Example**: A received snap entry might read: `{"From": "friend1", "Media Type": "IMAGE", "Created": "2025-07-01 15:30:00 UTC"}` meaning friend1 sent you a photo Snap at that time. A sent snap entry might be `{"To": "friend2", "Media Type": "VIDEO", "Created": "2025-07-01 16:00:00 UTC"}` indicating you sent a video Snap to friend2. **Media Type** values here are explicitly “IMAGE” or “VIDEO” (as confirmed by multiple sources).

Snap history does **not** include content or thumbnails, and as mentioned, **no “Media IDs” field** is present – only the type. It’s mainly useful to see when and with whom snaps were exchanged. If you requested **memories or chat media**, those are separate; `snap_history` is strictly the ephemeral snap logs.

### Memories (`memories_history.json`)

Snapchat Memories are snaps you saved to your cloud storage in Snapchat. The `memories_history.json` lists all items in your Memories. Each entry typically includes:

  * **“Date”**: The date/time the memory was created or saved.
  * **“Media Type”**: What kind of media the memory is. It will be **`"Image"` or `"Video"`** (or possibly `"Image/Video"` for multi-snaps) depending on whether the memory snap was a photo or video. If you backed up text-only chat screenshots, they’d still be images.
  * **“Caption”**: If the snap had a caption or text overlay when saved to memories, this might be stored. If no caption, this field could be blank or null. (For example, one export snippet shows an image memory with no caption vs one with a caption.)
  * **“Location”**: If location data was saved with the snap (for example, if the snap had a geofilter or the device tagged GPS info), the memory entry may include location details. This could be a place name or coordinates. If the memory has no location info, this field may be absent or null.
  * **“Media ID/Filename”**: The export might list a filename or ID for each memory. If you included Memories in your download, the actual media files (photos/videos) for each memory **should** be included in a separate folder (often they provide them, since you toggled “Include Memories” in the request). The JSON might have a reference to the file name or a memory ID. If the actual memory media files are provided, they will likely appear in an `memories_media` folder or similar, with names possibly matching dates or memory IDs. (If not provided, there may be a URL or ID that Snapchat uses internally.)
  * **Additional metadata**: Possibly lens/filter used, or the memory’s “Our Story” status if it was a story snap saved. Typically, however, it’s just the basics above.

**Possible values**: **Media Type** here will be `Image` or `Video`. Captions vary per snap (free text or empty). If location is included, it could be a venue name (e.g. “New York, NY”) or GPS coordinates.

Memories JSON can be quite large if you have many memories (the HTML in one example was \~5.7 MB, listing thousands of entries). Each entry corresponds to a snap you saved to Memories.

### Story and Spotlight History

  * **`story_history.json`**: This file contains records of **Stories** and possibly **Spotlight submissions** associated with your account. It typically logs two aspects:
      * **Stories you posted** (My Story or Custom Stories): Each story snap you posted may be listed with a timestamp and basic info. It might include the **Media Type** (`Image`/`Video`) of the story, when it was posted (and perhaps when it expired), and maybe an ID. It could also note the **audience** (e.g. My Story vs a private story name). If Snapchat recorded views or interactions, they might not be in this file – likely it’s just your posting history.
      * **Stories you viewed**: Snapchat’s support description says story history includes viewing records. It may log which friends’ or publishers’ stories you have viewed and when. (This part of data might be limited; not all exports have detailed view logs, but it’s possible.) Fields might include the story publisher’s username, and timestamp of view.
      * **Possible field values**: If present, **Media Type** would be `IMAGE` or `VIDEO` for each story snap (similar to `snap_history`). There might be a field indicating **“Story Type”** (e.g. `MY_STORY` vs `PRIVATE_STORY` vs `SHARED_STORY`). For story views, fields could be **“Viewer”** (you) and **“Story Owner”** (friend’s username) or story title, with a timestamp. If you posted to **Spotlight** or **Snap Map (Our Story)**, those submissions could appear here or in a related file (possibly labeled as spotlight or crowd-sourced story submissions).
  * **`shared_story.json`**: This appears to capture data about **Shared Stories** you are part of. Shared Stories (formerly Custom or Geo Stories) are those story groups where multiple people can contribute. The JSON likely lists any such story groups you belong to, possibly with the story name and members or your contributions. For example, if you have a shared story named “Trip 2025” with friends, this file might note the story name, when you joined or when it was created, and any snaps of yours posted to it. (No fixed enum values beyond story names and user lists – content is user-specific.)
    If you have no shared story involvement, this file may be empty or not present. Otherwise, expect fields like “Story Title”, “Role” (maybe “Member” or “Owner”), and possibly a list of your story posts within that shared story (with timestamps similar to `story_history`).

### App and Activity History

  * **`search_history.json`**: A log of searches you’ve performed in the app. This can include searches for other users, searches for filters or lenses, and potentially map or spotlight searches. Fields typically include the **search query text** and a **timestamp**. It might also categorize the type of search (for example, searching for a user vs searching for a song or a Lens). If so, a field like “Search Type” could have values such as `USER`, `LENS`, `CHAT`, `SNAPCODE`, etc. (This isn’t confirmed, but some apps do mark the category of search.) In many cases, it may just list the raw query and date. (The content of queries will vary; no fixed set except possibly types if included.)
  * **`location_history.json`**: If you had Snap Map enabled or used location features, this file contains your past location check-ins or updates. Snapchat periodically records your device’s location when you have the app open (for Snap Map). The JSON can include a **timestamp** and **coordinates** for each recorded location ping. Some entries might also have a **location name** (e.g. resolved city name or place if Snapchat was able to reverse geocode). Fields might be: latitude, longitude, altitude, accuracy radius, and the time. There may also be entries for places you actively shared (like tagging a location in a Snap). Because location pings can be frequent, this file can be quite large (hundreds of KB if you used Snap Map often). (No enumerations except perhaps a “source” field like “Snap Map” vs “Story Geotag”; primarily numerical data.)
  * **`snap_games_and_minis.json`**: Records of any Snap Games or Minis you interacted with. Snap Games are in-app games, and Minis are mini-applications (like polls, scheduling, etc.) in Snapchat. This file might list each game/mini you opened, possibly with a timestamp or frequency count. Fields might include the **name of the game/mini** and last played date. If a “game ID” or developer name is included, that could appear. Since this JSON was tiny in examples (only a few bytes if no usage), it’s likely only populated if you used those features. (Potential enumerations: none aside from listing specific game titles.)
  * **`ranking.json`**: The purpose of this file is a bit unclear, but given its small size in exports, it might contain your **Best Friends ranking** or friend interaction rankings. Snapchat internally ranks the friends you interact with most (to determine best friends and emojis). This JSON might include a list of friend usernames with some score or order. If present, the “rank” could simply be the order of your top friends. (Alternatively, it might relate to Discover content ranking – but likely it’s friend-related.) Possible fields: a list of friend IDs in descending order of interaction. Since Snapchat doesn’t publicly show best friend lists anymore, this is more for personal insight. (If included, it could just be an ordered list – not much in terms of varied values except friend identifiers.)
  * **`talk_history.json`**: This file logs **Voice/Video call history** (Snapchat’s audio/video call feature is sometimes referred to as “Snap Talk”). If you have made or received calls, especially if they were answered, this file could have entries for each call. Fields might include:
      * **“Sender”/“Receiver”**: who initiated or who was in the call,
      * **“Started” timestamp and “Duration”** of the call,
      * **“Type”**: which could be **`VOICE` or `VIDEO`** call. (These would be the possible enumerations: e.g. `Type: VIDEO` or `AUDIO`.)
      * **“Status”**: maybe whether it was answered or missed. (For example, a missed call might be logged with duration 0 or a flag.)
        In the data export, if a call occurred and was logged, you might see an entry like: `{"From": "friendA", "To": "myusername", "Type": "VIDEO", "Started": "2025-07-01 20:00:00 UTC", "Duration": 120}` (for a 2-minute video call). Missed calls might appear with a short duration or a note. If you rarely use calls, this file may be almost empty (one user’s `talk_history.json` was only 109 bytes with no call data).
        (Possible values for call type: likely “AUDIO” or “VIDEO”. Status: possibly “missed”, “answered” if provided, or implied by duration.)

### Purchase & Shop History

  * **`purchase_history.json`**: Records of any purchases made in Snapchat. This typically covers things like **Geofilters or Lenses you bought, Snap Tokens, or other in-app purchases**. If you never bought anything, this might be empty (small size \~52 bytes indicates none). If you did, each entry might include: **Item** (name of purchase, e.g. “Geofilter – Birthday Party 2024”), **Date** of purchase, **Amount** (cost and currency), and possibly **Order ID**. (No repeating enumerations aside from maybe item categories: e.g. Filter, Lens, etc.)
  * **`shop_history.json`**: This may log your interactions with the Snapchat Shop (which could include merchandise or Snap’s store features). It might overlap with `purchase_history`. For instance, if you bought a physical item or a Spectacles device, or even if you just browsed Lens Store items, it could show up. Possibly includes **items viewed or added to cart**. However, many exports show this as almost empty. If used, fields could be item name and date of view/purchase. (Likely minimal; no fixed values except item names.)
  * **`snap_ads.json`**: This file is typically very small; it may contain data related to Snapchat ads. It could list **ad topics or interest categories** Snapchat has associated with you (for ad targeting), or your engagement with ads (like if you tapped certain ads). Snapchat’s ad preferences might be included here (e.g. a list of lifestyle interest categories you fit into). If so, possible values are things like “Sports Enthusiast”, “Travel”, etc., or boolean flags for personalized ads. Since an example size was \~500 bytes, it’s likely just a short list of categories or a simple profile. (Enumerations: various interest tags or a yes/no on whether you allow targeted ads.)

### User Content and Personalization

  * **`bitmoji.json`**: Data related to your **Bitmoji** avatar. This might include your Bitmoji’s avatar ID, the last time you updated it, or the outfit/style you use. It could also include a URL to your Bitmoji image. Since Bitmoji details don’t have a lot of variety (it’s mostly an ID or traits), this file is often small. (No significant enumerations; just your avatar info.)
  * **`bitmoji_kit_user.json`**: Likely a flag or small dataset for Bitmoji Kit (third-party usage of your Bitmoji). For example, if you used Bitmoji in other apps or games, it might record an ID. If unused, it’s essentially empty (one example was 2 bytes). (No meaningful content unless you authorized Bitmoji kit somewhere.)
  * **`cameos_metadata.json`**: This pertains to **Snapchat Cameos** (the feature where you put your face in animated clips). It likely contains the information about your Cameo selfie. Possibly an ID of your cameo selfie and whether you have it enabled. Since one export showed this at 42 bytes, it might just be a couple of true/false flags (like “hasCameo: true”). If you haven’t set up Cameos, it might be empty or absent. (Possible field: “Cameo Selfie ID” or a yes/no flag for having created one.)
  * **`emoji_skin_tone.json`** (not explicitly listed above, but some exports include a setting for the default emoji skin tone you chose, if any – this could be embedded in `user_profile` or as a separate small file. If present, values would be one of the skin tone modifiers or “default”.)

### Snapchat Support & Safety

  * **`support_note.json`**: Any interactions with Snapchat Support. If you ever contacted support or had a support case, there might be a log or reference number here. Alternatively, Snapchat sometimes logs if your account was ever compromised or if any administrative notes exist. Since this file is often just a few bytes, typically it’s empty for most users. If not, it might contain a case ID or note text. (No set values; just whatever support wrote.)
  * **`in_app_reports.json`**: Logs of any **in-app reports** you’ve made. For example, if you reported a story, a Snap, or a user for violations, Snapchat could list those here. Each report entry might include: **Date** of report, **Report Type** (e.g. “Harassment” or “Spam”), and maybe the target (username or content ID reported). Possible enumeration: **Report Type** could be one of Snapchat’s categories like `Pornography`, `Hate Speech`, `Illegal Activity`, etc. If you never reported anything, this will be empty.
  * **`in_app_surveys.json`**: Data from any **surveys** or questionnaires Snapchat showed you in the app (Snapchat occasionally does user surveys or feedback forms). If you responded to a survey, your answers might be here. Most users will have none (the example was 2 bytes). If present, it could contain survey IDs and your response choices. (Enumerations would be specific to the survey.)
  * **`terms_history.json`**: The history of your agreement to Snapchat’s terms and policies. Likely it logs when you accepted the Terms of Service, Privacy Policy updates, or similar. Fields might include **“Terms Version”** and **date accepted**. For instance, an entry might say you accepted Terms of Service version X on a certain date. If multiple policies (Terms, Privacy) were accepted, each might be listed. (Possible values: e.g. “Terms of Service v10 – Accepted on 2023-05-01”, etc.)
  * **`privacy_settings.json`** (if included) – This could list your current privacy settings (like who can view your story, who can contact you, etc.). Not explicitly seen above, but some exports include a snapshot of settings. Values might be **Friends** vs **Everyone** for various toggles. (If not a separate file, these may be in `account.json` or `user_profile.json`.)
  * **`email_campaign_history.json`**: This file (not always mentioned on support pages, but present in exports) logs marketing or informational emails Snapchat has sent you. For example, Snapchat often emails “Your memories from 1 year ago today” or product announcements. This JSON could list each email by **campaign name** and date sent. E.g., an entry might be “Memories Flashback Email – sent 2025-06-30”. This lets you see which promo emails you got. (No fixed categories beyond the email titles.)

-----

## Additional Files

In the HTML version of the export, you might see files like **`FAQ.html`** or **`index.html`** – these are just for helping you navigate the data and do not contain personal data that isn’t in the JSON. For example, `faq.html` might just explain the data fields, and `index.html` links to all sections. These are not user-specific data.

Similarly, **image and video files** in the export (like those in **`chat_media`** or your memory snaps) will be accompanied by the above JSON records that reference them. The export may also include copies of your **Snapcode** or Bitmoji avatar image (e.g., a PNG of your Snapcode), and possibly any **custom stickers** you made (as image files). If you created any **Cameo clips**, those might not be directly provided, but the selfie used for Cameos might be included as an image.

-----

## Conclusion

The Snapchat data dump truly includes “everything” Snapchat has retained about your usage (within the retention timeframe). The **HTML files vs JSON files contain the same information** – HTML is just the recommended viewing format. Every piece of data from friends list to search history is in the JSON, often with an HTML counterpart. And importantly, **there is a way to link media files to chats: the `Media IDs` in `chat_history.json` map to the filenames of images/videos in the `chat_media` folder**.

We’ve enumerated fields like **Media Type** (e.g. `TEXT` vs `MEDIA` in chats, or `IMAGE` vs `VIDEO` in snaps), friend request direction, and others for each JSON. Using this, you can interpret all the different cases of data entries in your Snapchat archive and know what each value represents. All told, the official Snapchat data download provides a remarkably detailed ledger of your saved interactions and account details – spanning login history, profiles, friends, snaps, chats, memories, and beyond – giving you insight into nearly everything Snapchat has on record for your account.

-----

*Sources: Snapchat Support documentation and user analyses were used to compile this information, as well as examples from Snapchat data exports and community forums for linking media and enumerating field values. All citations correspond to publicly available references explaining Snapchat’s data export format and content.*