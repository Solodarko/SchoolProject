# Demo: Accessing Meeting Management Dashboard

## Quick Start Guide

### 🎯 Objective
View all Zoom meetings (including those created via API) in the Meeting Management section of the Enhanced Zoom Dashboard.

### 📍 How to Access

1. **Start the Backend Server**
   ```bash
   cd Backend
   npm start
   # Server runs on http://localhost:5000
   ```

2. **Start the Frontend Application**
   ```bash
   cd Frontend
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

3. **Login as Admin**
   - Navigate to: `http://localhost:5173`
   - Login with admin credentials
   - Ensure your user role is set to 'admin'

4. **Access Meeting Management**
   - Go to: `http://localhost:5173/admin-dashboard/meeting-management`
   - Or use the sidebar: **Admin Dashboard → Meeting Management**

### 🔍 What You'll See

#### Dashboard Overview
- **Total Meetings**: Count of all meetings in the system
- **Scheduled**: Meetings that haven't started yet
- **In Progress**: Currently active meetings
- **Completed**: Finished meetings

#### Meeting List Table
Each meeting displays:
- **Meeting Title**: The topic/name of the meeting
- **Type**: Online, In-person, or Hybrid
- **Start Time**: When the meeting is scheduled/was started
- **Duration**: How long the meeting lasts
- **Organizer**: Who created the meeting
- **Status**: Current meeting status
- **Attendance**: Attendance percentage
- **Actions**: Edit, view, or delete options

#### Real-time Features
- **Auto-refresh**: Updates every 30 seconds
- **Live notifications**: Instant updates when meetings are created/modified
- **Socket.IO integration**: Real-time synchronization

### 🧪 Test Integration

#### Create a Zoom Meeting via API
```bash
# Run the test script to create a meeting
node test-meeting-integration.js
```

#### Or manually test with curl:
```bash
curl -X POST http://localhost:5000/api/zoom/create-meeting \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Demo Meeting - Manual Test",
    "duration": 60,
    "type": 1,
    "settings": {
      "host_video": true,
      "participant_video": true
    }
  }'
```

#### Verify in Dashboard
1. Refresh the Meeting Management page
2. Your new meeting should appear in the list
3. Check that all details are correctly displayed

### 📊 API Endpoints You Can Test

#### View All Meetings
```bash
curl http://localhost:5000/api/meetings
```

#### View Meeting Analytics
```bash
curl http://localhost:5000/api/meetings/stats/analytics
```

#### Filter Meetings
```bash
curl "http://localhost:5000/api/meetings?status=scheduled&type=online"
```

### 🚀 Expected Results

✅ **Every Zoom meeting created via the API appears in Meeting Management**
✅ **Real-time updates work correctly**
✅ **Statistics are accurate and up-to-date**
✅ **Full CRUD operations are available**
✅ **Filtering and search work properly**

### 🔧 Troubleshooting

#### If meetings don't appear:
1. Check backend console for errors
2. Verify MongoDB is running and connected
3. Ensure Zoom API credentials are properly configured
4. Check browser console for frontend errors

#### If real-time updates don't work:
1. Verify Socket.IO connection in browser dev tools
2. Check backend Socket.IO configuration
3. Ensure CORS settings allow WebSocket connections

### 📝 Next Steps

1. **Create meetings** via the Zoom API
2. **Monitor them** in the Meeting Management dashboard
3. **Manage participants** using the participant tracking features
4. **Generate reports** using the analytics endpoints
5. **Use real-time features** for live monitoring

The integration is complete and ready for production use! 🎉
