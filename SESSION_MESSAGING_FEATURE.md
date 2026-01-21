# Session-Based Messaging Feature

## Overview
This document describes the implementation of the session-based messaging feature that enables real-time communication between employees and mentors within the context of a booked session.

## Architecture

### Backend

#### Routes (`/routes/messageRoutes.js`)
All messaging routes are protected by the `protectBoth` middleware which authenticates both users and mentors.

**Endpoints:**
- `POST /api/messages/send` - Send a message in a session
- `GET /api/messages/session/:sessionId` - Get all messages for a session
- `PATCH /api/messages/mark-read/:sessionId` - Mark messages as read
- `GET /api/messages/unread-count` - Get unread message count
- `GET /api/messages/conversations` - Get all conversations (sessions with messages)

#### Authentication Middleware (`protectBoth`)
The custom `protectBoth` middleware:
1. Decodes the JWT token
2. Checks the `role` field in the token
3. If role is `mentor`:
   - Validates against Mentor model
   - Checks approval status and active status
   - Sets `req.mentor` object
4. If role is `user` or `admin`:
   - Sets `req.user` object
5. Ensures only one of `req.user` or `req.mentor` is set

#### Controller (`/controllers/messageController.js`)
**Key Functions:**
- `sendMessage()` - Creates and saves a new message
- `getSessionMessages()` - Retrieves all messages for a session
- `markMessagesAsRead()` - Marks messages from the other party as read
- `getUnreadCount()` - Returns count of unread messages
- `getConversations()` - Returns all sessions with message metadata
- `canSendMessage()` - Utility to check if messaging is allowed

**Messaging Rules:**
- **Message threads are automatically created when a session is booked** - no separate thread creation needed
- An employee or mentor can send a message **if and only if** they belong to the same session
- Messaging is allowed for sessions with status: `scheduled`, `completed`
- Messaging is blocked for sessions with status: `cancelled`, `no-show`
- **Session duration does not affect messaging** - users can message before, during, and after the session
- Only session participants (mentor or employee) can send/view messages

#### Models

**SessionMessage Model:**
```javascript
{
  sessionId: ObjectId (ref: MentorSession),
  senderId: ObjectId,
  senderType: String (enum: ['mentor', 'user']),
  message: String,
  isRead: Boolean,
  readAt: Date,
  timestamps: true
}
```

### Frontend

**Important:** The backend API returns session data with the following structure:
- `session.mentorId` - The mentor object (NOT `session.mentor`)
- `session.userId` - The employee/user object (NOT `session.employee`)
- `session.sessionTypeId` - The session type object (NOT `session.sessionType`)

Make sure to use these correct property names when accessing data in the frontend.

#### Components

**SessionChat Component** (`/components/SessionChat.jsx`)
A reusable chat component that can be embedded in any session detail page.

**Props:**
- `sessionId` - The MongoDB ObjectId of the session
- `currentUserType` - Either "mentor" or "user"

**Features:**
- Auto-scrolls to bottom on new messages
- Polls for new messages every 10 seconds
- Facebook-style message bubbles (blue for sender, gray for receiver)
- Shows sender avatar for received messages
- Displays timestamp for each message
- Real-time message sending with loading states

#### Pages

**EmployeeSessionDetail** (`/pages/EmployeeSessionDetail.jsx`)
- Route: `/employee/sessions/:sessionId`
- Shows session information, mentor details, and chat
- Displays meeting link when available
- Shows mentor feedback/evaluation if provided
- Includes invoice download for paid sessions

**MentorSessionDetail** (`/pages/MentorSessionDetail.jsx`)
- Route: `/mentor/sessions/:sessionId`
- Shows employee information and session details
- Allows mentor to add/update meeting link
- Provides areas for private notes and public evaluation
- Includes the SessionChat component for communication

#### Routing

Routes added to `App.js`:
```javascript
<Route path="/employee/sessions/:sessionId" element={<EmployeeSessionDetail />} />
<Route path="/mentor/sessions/:sessionId" element={<MentorSessionDetail />} />
```

#### Navigation Updates

**MySessions Page:**
- "View Details" button now navigates to `/employee/sessions/:sessionId`
- Previously navigated to `/sessions/:sessionId/confirmation`

## User Flow

### Employee Flow
1. Employee books a session with a mentor
2. Employee navigates to "My Sessions"
3. Employee clicks "View Details" on a session
4. Employee sees session details and chat interface
5. Employee can send messages to mentor
6. Employee receives messages from mentor in real-time
7. Employee can join meeting when link is available

### Mentor Flow
1. Mentor receives a session booking
2. Mentor navigates to "Manage Sessions"
3. Mentor clicks on a session to view details
4. Mentor sees employee details and chat interface
5. Mentor can add meeting link
6. Mentor can send messages to employee
7. Mentor can add private notes and public evaluation
8. Mentor can mark session as completed

## Styling

### SessionChat.css
- Clean, modern Facebook Messenger-style interface
- Blue bubbles for sent messages (right-aligned)
- Gray bubbles for received messages (left-aligned)
- Rounded corners with subtle shadows
- Fixed height container with scrollable message area
- Sticky input area at bottom
- Responsive design

## API Integration

### Token Management
- Employee: Uses `localStorage.getItem("token")`
- Mentor: Uses `localStorage.getItem("mentorToken")`

### Polling Strategy
Messages are fetched every 10 seconds to simulate real-time updates. For production, consider implementing WebSocket connections for true real-time messaging.

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Authorization Checks**: Users can only access messages for sessions they're part of
3. **Role Validation**: Middleware validates user role matches token
4. **Session Participant Verification**: Controller verifies user is mentor or employee of the session
5. **Status-Based Access**: Messaging blocked for cancelled/no-show sessions

## Future Enhancements

1. **WebSocket Integration**: Replace polling with Socket.io for real-time updates
2. **File Sharing**: Allow users to share files/images in chat
3. **Typing Indicators**: Show when the other party is typing
4. **Read Receipts**: Show when messages are read
5. **Message Notifications**: Push notifications for new messages
6. **Message Search**: Search through message history
7. **Message Reactions**: Add emoji reactions to messages
8. **Voice Messages**: Support for voice note recording
9. **Video Call Integration**: Direct video call from chat interface
10. **Message Deletion**: Allow users to delete their own messages

## Testing Checklist

### Backend
- [ ] Send message as employee
- [ ] Send message as mentor
- [ ] Retrieve messages for a session
- [ ] Mark messages as read
- [ ] Get unread count
- [ ] Get all conversations
- [ ] Verify authorization (non-participants cannot access)
- [ ] Verify messaging blocked for cancelled sessions

### Frontend
- [ ] Chat component renders correctly
- [ ] Messages display in correct order
- [ ] Sent messages appear on right (blue)
- [ ] Received messages appear on left (gray)
- [ ] Auto-scroll works on new messages
- [ ] Polling fetches new messages
- [ ] Send button disabled when input empty
- [ ] Loading state shows while sending
- [ ] Employee can access session detail page
- [ ] Mentor can access session detail page
- [ ] Navigation from MySessions works correctly

## Troubleshooting

### Messages not appearing
- Check browser console for API errors
- Verify token is valid and not expired
- Ensure user is participant in the session
- Check session status (not cancelled/no-show)

### Authentication errors
- Verify correct token is being used (token vs mentorToken)
- Check JWT_SECRET is set in backend .env
- Ensure token includes correct role field

### Polling not working
- Check browser console for errors
- Verify interval is set correctly (10000ms)
- Ensure component cleanup clears interval

## API Response Examples

### Send Message
**Request:**
```json
POST /api/messages/send
{
  "sessionId": "507f1f77bcf86cd799439011",
  "message": "Hello, looking forward to our session!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "sessionId": "507f1f77bcf86cd799439011",
    "senderId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "senderType": "user",
    "message": "Hello, looking forward to our session!",
    "isRead": false,
    "createdAt": "2025-12-21T17:30:00.000Z"
  }
}
```

### Get Session Messages
**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "message": "Hello!",
        "senderType": "user",
        "sender": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2025-12-21T17:30:00.000Z"
      }
    ],
    "session": {
      "sessionId": "SES-2025-001",
      "status": "scheduled",
      "scheduledDate": "2025-12-25T00:00:00.000Z",
      "scheduledTime": "10:00 AM - 11:00 AM"
    },
    "messagingAllowed": true,
    "messagingReason": "Messaging is active"
  }
}
```

## Conclusion

This messaging feature provides a seamless communication channel between employees and mentors, scoped to individual sessions. The implementation follows best practices for security, user experience, and code organization.
