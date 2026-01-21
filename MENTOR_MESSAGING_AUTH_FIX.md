# Mentor Messaging Authentication Fix

## Issue
Mentor receives messages from employee but when trying to reply, gets error: "You are not a participant in this session"

## Root Cause
The `canSendMessage` function was not properly handling ObjectId comparisons. When the session is populated with mentor/user data, `session.mentorId` might be an object with an `_id` property, not just a plain ObjectId.

## Fix Applied

### File: `messageController.js`

#### 1. Updated `canSendMessage` function (Lines 13-18)

**Before:**
```javascript
const isMentor = userType === "mentor" && session.mentorId.toString() === userId;
const isEmployee = userType === "user" && session.userId.toString() === userId;
```

**After:**
```javascript
// Convert IDs to strings for comparison
const sessionMentorId = session.mentorId?._id ? session.mentorId._id.toString() : session.mentorId.toString();
const sessionUserId = session.userId?._id ? session.userId._id.toString() : session.userId.toString();
const currentUserId = userId.toString();

// Check if user is part of the session
const isMentor = userType === "mentor" && sessionMentorId === currentUserId;
const isEmployee = userType === "user" && sessionUserId === currentUserId;
```

**Why this works:**
- Handles both populated and unpopulated session objects
- If `session.mentorId` is populated (has `_id` property), extracts the ID
- If `session.mentorId` is just an ObjectId, uses it directly
- Ensures all IDs are converted to strings before comparison

#### 2. Added Debug Logging

Added comprehensive logging to track:
- Authentication state (`req.user` vs `req.mentor`)
- Sender ID and type
- Session IDs being compared
- Comparison results

**Logs in `sendMessage`:**
```javascript
console.log('sendMessage called:', {
    sessionId,
    senderId,
    senderType,
    hasUser: !!req.user,
    hasMentor: !!req.mentor,
    userObj: req.user,
    mentorObj: req.mentor
});

console.log('Session found:', {
    sessionId: session._id,
    mentorId: session.mentorId,
    userId: session.userId,
    sessionStatus: session.sessionStatus
});
```

**Logs in `canSendMessage`:**
```javascript
console.log('canSendMessage check:', {
    userType,
    currentUserId,
    sessionMentorId,
    sessionUserId,
    isMentor,
    isEmployee
});
```

## Testing

### Test Scenario 1: Employee sends message
1. Login as employee
2. Go to Messages
3. Select a session with a mentor
4. Send a message
5. **Expected:** Message sent successfully

### Test Scenario 2: Mentor replies
1. Login as mentor
2. Go to Messages
3. See the message from employee
4. Reply to the message
5. **Expected:** Message sent successfully (NO "not a participant" error)

### Test Scenario 3: Check logs
1. Open backend console/logs
2. Send a message from mentor
3. Check the console output for:
   ```
   sendMessage called: { ... }
   Session found: { ... }
   canSendMessage check: { ... }
   ```
4. Verify:
   - `senderType: 'mentor'`
   - `hasMentor: true`
   - `isMentor: true`
   - `sessionMentorId` matches `currentUserId`

## What to Look For in Logs

### Successful Mentor Message:
```
sendMessage called: {
  sessionId: '...',
  senderId: '67...',
  senderType: 'mentor',
  hasUser: false,
  hasMentor: true,
  mentorObj: { id: '67...', name: '...', ... }
}

Session found: {
  sessionId: '...',
  mentorId: '67...',  // or { _id: '67...', name: '...', ... }
  userId: '...',
  sessionStatus: 'scheduled'
}

canSendMessage check: {
  userType: 'mentor',
  currentUserId: '67...',
  sessionMentorId: '67...',
  sessionUserId: '...',
  isMentor: true,
  isEmployee: false
}
```

### If Still Failing:
Look for:
- `isMentor: false` when it should be `true`
- Mismatched IDs between `currentUserId` and `sessionMentorId`
- `hasMentor: false` (authentication issue)

## Additional Checks

If the issue persists after this fix, check:

1. **Mentor Authentication:**
   - Is `localStorage.getItem("mentorToken")` valid?
   - Is the token being sent in Authorization header?
   - Is `protectBoth` middleware setting `req.mentor` correctly?

2. **Session Data:**
   - Is the session actually assigned to this mentor?
   - Run in MongoDB: `db.mentorsessions.findOne({ _id: ObjectId("...") })`
   - Verify `mentorId` matches the logged-in mentor's ID

3. **Token Payload:**
   - Decode the JWT token
   - Verify it has `role: "mentor"` and correct `id`

## Rollback (if needed)

If this causes issues, revert to:
```javascript
const isMentor = userType === "mentor" && session.mentorId.toString() === userId;
const isEmployee = userType === "user" && session.userId.toString() === userId;
```

And investigate why `session.mentorId` is populated when it shouldn't be.

## Next Steps

1. Test mentor messaging thoroughly
2. Monitor backend logs for any errors
3. If working correctly, remove debug console.logs in production
4. Document the fix in main documentation

## Related Files
- `messageController.js` - Main fix location
- `messageRoutes.js` - Authentication middleware
- `mentorAuth.js` - Mentor authentication
- `MentorMessages.jsx` - Frontend mentor messages page
