# Interview Connection System - Documentation

## Overview

The new interview connection system allows users to find and connect with interview practice partners through the backend server. This system is **completely separate** from the existing video calling logic and provides a structured way to manage interview sessions.

## Architecture

### System Flow

```
Frontend User                Backend Server              Database
    |                            |                          |
    |-- Request Interview ------>|                          |
    |                            |-- Create Request ------->|
    |                            |<-- Request ID ----------|
    |                            |                          |
    |<-- Poll for Match ---------|-- Check Requests ------>|
    |   (Every 2 seconds)        |<-- No Match Yet ---------|
    |                            |                          |
    |                            |   [User 2 Joins]         |
    |                            |<-- Create Request ------->|
    |                            |-- Match Found! --------->|
    |                            |-- Create Session ------->|
    |<-- Match Found! ----------|<-- Room ID -------------|
    |                            |                          |
    |-- Start Video Call ------->|                          |
    |   (Using Room ID)          |                          |
    |                            |                          |
    |-- End Call + Session ----->|-- Update Session ------->|
    |                            |   (Set ended_at, etc)    |
```

## Backend Components

### 1. Database Models (`app/models.py`)

#### InterviewRequest
Represents a user's request to find an interview partner.

```python
class InterviewRequest(SQLModel, table=True):
    id: int | None                    # Primary key
    requester_id: int                 # Foreign key to User
    exam_type: ExamType              # JEE, NEET, NDA, etc.
    status: str                       # waiting | matched | expired
    session_id: int | None            # FK to InterviewSession (when matched)
    created_at: datetime              # Request creation time
```

**Status Flow:**
- `waiting` → User creates request, waiting for a partner
- `matched` → A partner was found, session created
- `expired` → Request timed out (optional, can be implemented)

#### InterviewSession
Represents an active interview session between two users.

```python
class InterviewSession(SQLModel, table=True):
    id: int | None                    # Primary key
    initiator_id: int                 # User who started the session
    partner_id: int                   # Other user in the session
    exam_type: ExamType              # The exam they're practicing
    status: str                       # active | ended
    room_id: str                      # WebRTC room ID (unique)
    started_at: datetime              # When video started
    ended_at: datetime | None         # When video ended
    duration_seconds: int | None      # Total call duration
    created_at: datetime              # Session creation time
```

### 2. API Endpoints (`app/routers/interview.py`)

#### POST `/api/interview/request`
Create an interview request and find a matching partner.

**Request:**
```json
{
  "exam_type": "JEE"
}
```

**Response:**
```json
{
  "id": 1,
  "requester_id": 5,
  "exam_type": "JEE",
  "status": "waiting",
  "session_id": null,
  "created_at": "2024-01-15T10:30:00"
}
```

**Logic:**
1. Checks if user already has an active request
2. Searches for other users waiting with same exam type
3. If found:
   - Creates InterviewSession with both users
   - Links both InterviewRequests to the session
   - Sets status to "matched"
4. If not found:
   - Creates request with status "waiting"
   - Frontend polls for match

#### GET `/api/interview/active`
Retrieve user's current active interview session.

**Response:**
```json
{
  "id": 1,
  "initiator_id": 5,
  "partner_id": 8,
  "initiator_name": "John Doe",
  "partner_name": "Jane Smith",
  "initiator_avatar": "https://...",
  "partner_avatar": "https://...",
  "exam_type": "JEE",
  "status": "active",
  "room_id": "abc-123-xyz",
  "started_at": null,
  "ended_at": null,
  "duration_seconds": null,
  "created_at": "2024-01-15T10:30:00"
}
```

#### GET `/api/interview/partner`
Get information about the current interview partner.

**Response:**
```json
{
  "user_id": 8,
  "full_name": "Jane Smith",
  "avatar_url": "https://...",
  "target_exam": "JEE",
  "current_level": "Advanced"
}
```

#### POST `/api/interview/end`
End an active interview session.

**Request:**
```json
{
  "session_id": 1
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Interview session ended",
  "duration_seconds": 1245
}
```

**Logic:**
1. Verifies user is part of this session
2. Sets session status to "ended"
3. Records end time and calculates duration

#### GET `/api/interview/history`
Get all past interview sessions for the user.

**Response:**
```json
[
  {
    "id": 1,
    "initiator_id": 5,
    "partner_id": 8,
    "initiator_name": "John Doe",
    "partner_name": "Jane Smith",
    ...
    "duration_seconds": 1245,
    ...
  }
]
```

#### DELETE `/api/interview/request/{request_id}`
Cancel an interview request.

**Response:**
```json
{
  "status": "success",
  "message": "Interview request cancelled"
}
```

## Frontend Components

### 1. Interview Connection Service (`src/lib/interviewConnection.js`)

Provides functions to interact with the backend API:

```javascript
// Create a request to find a partner
await createInterviewRequest(examType)

// Get active session
const session = await getActiveSession()

// Get partner info
const partner = await getPartnerInfo()

// End interview session
await endInterviewSession(sessionId)

// Cancel request
await cancelInterviewRequest(requestId)

// Get past sessions
const history = await getInterviewHistory()

// Poll for match (waits up to 2 minutes)
const session = await pollForMatch()
```

### 2. Interview Matching Panel Component (`src/components/InterviewMatchingPanel.jsx`)

A self-contained component that handles the entire matching workflow:

**Features:**
- Visual state management (idle → searching → matched → error)
- Automatic polling for matches (every 2 seconds)
- Timeout after 2 minutes of searching
- Displays partner information when matched
- Callback when match is found

**States:**
1. **idle**: User hasn't started searching
2. **searching**: Actively polling for a match
3. **matched**: Partner found, ready for video
4. **error**: Timeout or error occurred

**Props:**
```javascript
<InterviewMatchingPanel 
  onMatchFound={(matchData) => {}}  // Callback when match found
  currentExamType="JEE"             // Exam type to match on
  isVisible={true}                  // Show/hide component
/>
```

**Callback Data:**
```javascript
{
  sessionId: 1,           // ID of the interview session
  roomId: "abc-123-xyz",  // WebRTC room ID to use
  partner: {              // Partner information
    user_id: 8,
    full_name: "Jane Smith",
    avatar_url: "...",
    target_exam: "JEE",
    current_level: "Advanced"
  }
}
```

### 3. Updated Interview Page (`src/pages/InterviewPage.jsx`)

**Changes:**
1. Added matching panel at the top
2. Listens for `onMatchFound` callback
3. Automatically starts video call with matched room ID
4. Notifies backend when call ends

**New State:**
```javascript
const [showMatchingPanel, setShowMatchingPanel] = useState(true);
const [currentSessionId, setCurrentSessionId] = useState(null);
const [currentExamType, setCurrentExamType] = useState("JEE");
```

**New Handler:**
```javascript
const handleInterviewMatchFound = (matchData) => {
  // Hide matching panel
  setShowMatchingPanel(false);
  // Store session ID for later
  setCurrentSessionId(matchData.sessionId);
  // Use room ID from backend
  setRoomId(matchData.roomId);
  // Start video call
  startCall(matchData.roomId);
}
```

## Complete User Flow

### For User A (Initiator)

1. **Lands on Interview Page**
   - Sees matching panel with "Start Searching" button
   - Selects or confirms exam type (JEE/NEET/NDA)

2. **Clicks "Start Searching"**
   - Frontend calls `POST /api/interview/request`
   - Backend creates InterviewRequest with status "waiting"
   - Frontend starts polling `GET /api/interview/active`

3. **Waiting for Partner**
   - Shows spinner with elapsed time
   - Polls every 2 seconds
   - Can cancel anytime

4. **Partner Found!**
   - Backend creates InterviewSession
   - Polling detects active session
   - Shows partner info (name, avatar, exam, level)
   - Automatically starts WebRTC video call with room_id from session

5. **Video Call Active**
   - Both users see each other's video
   - Can mute/unmute and toggle camera
   - Existing video logic handles all WebRTC negotiation

6. **Call Ends**
   - User clicks "End Call"
   - Calls `POST /api/interview/end` with sessionId
   - Backend records end_time and duration
   - Matching panel reappears for next session

### For User B (Joiner)

- Same flow - they also search for a partner
- When A requests and then B requests with same exam type, they get matched
- B is automatically connected to A's session

## Database Schema

```sql
-- Interview Requests Table
CREATE TABLE interviewrequest (
  id INTEGER PRIMARY KEY,
  created_at DATETIME,
  requester_id INTEGER FOREIGN KEY,
  exam_type VARCHAR,
  status VARCHAR,  -- waiting | matched | expired
  session_id INTEGER FOREIGN KEY NULL
);

-- Interview Sessions Table
CREATE TABLE interviewsession (
  id INTEGER PRIMARY KEY,
  created_at DATETIME,
  updated_at DATETIME,
  initiator_id INTEGER FOREIGN KEY,
  partner_id INTEGER FOREIGN KEY,
  exam_type VARCHAR,
  status VARCHAR,  -- active | ended
  room_id VARCHAR UNIQUE,
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  duration_seconds INTEGER NULL
);
```

## Key Design Decisions

### 1. Separation from Video Logic
- Interview connection is a separate system
- Video logic remains completely unchanged in `video_server.py`
- Backend provides room IDs and partner info
- Frontend orchestrates the connection

### 2. Automatic Matching
- Backend automatically matches users when requests align
- No manual accept/reject needed
- Instant connection when both users search

### 3. Polling Strategy
- Frontend polls for active session every 2 seconds
- Timeout after 2 minutes of searching
- Simple and reliable for frontend implementation

### 4. Session Tracking
- Each interview session has unique room_id
- Backend records start time, end time, duration
- Useful for analytics and history

## Error Handling

### Common Scenarios

| Scenario | Backend Response | Frontend Action |
|----------|-----------------|-----------------|
| User already has active request | 409 Conflict | Show error message |
| No partner found within 2 min | Timeout | Allow retry |
| User tries to end other's session | 403 Forbidden | Reject request |
| Session not found | 404 Not Found | Show error |

## Security Considerations

- ✅ Authentication required on all endpoints (via get_current_user)
- ✅ Users can only end their own sessions
- ✅ Users can only view their own session history
- ✅ Room IDs are unique identifiers (UUID format)

## Future Enhancements

1. **Request Expiration**: Auto-delete waiting requests after timeout
2. **Rating System**: Rate your interview partner after call
3. **Session Stats**: Track avg call duration, partners met, etc.
4. **Difficulty Matching**: Match users of similar skill levels
5. **Scheduled Interviews**: Book interview at specific time
6. **Call Recording**: Optional recording of interview sessions
7. **Feedback Form**: Quick feedback after each interview

## Troubleshooting

### Match not found
- Check if backend is running
- Verify network connectivity
- Ensure both users have same exam type selected

### Video not connecting after match
- Verify video server is running on port 8001
- Check network connectivity
- Look at browser console for WebRTC errors

### Session end fails
- Verify session ID is correct
- Check if you're the participant in that session
- Ensure backend API is accessible

## Testing the System

### Manual Testing

1. **Same Device, Different Browsers**
   ```bash
   # Terminal 1
   cd backend
   .\.venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000

   # Terminal 2
   cd backend
   python app/video_server.py

   # Terminal 3
   cd frontend
   npm run dev

   # Terminal 4
   cd frontend
   npm run dev -- --port 5174
   ```

2. **Test Matching**
   - Open http://localhost:5173 in Chrome
   - Open http://localhost:5174 in Firefox
   - Both click "Start Searching" at same time
   - Should match within 2-4 seconds
   - Video call should connect automatically

### API Testing

```bash
# Create interview request
curl -X POST http://localhost:8000/api/interview/request \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"exam_type": "JEE"}'

# Get active session
curl http://localhost:8000/api/interview/active \
  -H "Authorization: Bearer <token>"

# End interview session
curl -X POST http://localhost:8000/api/interview/end \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"session_id": 1}'
```

---

**Last Updated:** January 2024  
**System Version:** 1.0 (Alpha)  
**Architecture:** Microservices (Backend + Frontend + WebRTC Server)
