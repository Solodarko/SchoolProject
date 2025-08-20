# Zoom Dashboard System

This system provides separate dashboards for Admin and User roles, implementing the flow: **Admin creates meetings** → **Users see join links** → **Real-time tracking on admin page**.

## 🏗️ Architecture

### Admin Dashboard (`AdminZoomDashboard.jsx`)
- **Create Zoom meetings** with custom settings
- **Monitor participants in real-time** with live updates
- **Track attendance automatically** as users join
- **End meetings** when necessary
- **Real-time WebSocket connection** for live participant updates

### User Dashboard (`UserZoomDashboard.jsx`)
- **View available meetings** with join buttons
- **Click to join** and automatically track attendance
- **Clean, simple interface** focused on joining meetings
- **User profile display** with student information

## 📁 File Structure

```
Frontend/src/
├── Components/
│   ├── Admin/
│   │   └── AdminZoomDashboard.jsx     # Admin meeting management & live tracking
│   ├── User/
│   │   └── UserZoomDashboard.jsx      # User meeting viewing & joining
│   └── Zoom/
│       ├── EnhancedZoomDashboard.jsx  # Previous combined component
│       └── ZoomRealTimeTracker.jsx    # Real-time tracking component
└── Pages/
    └── ZoomDashboardExample.jsx       # Demo page showing both dashboards
```

## 🚀 How to Use

### 1. Import the Components

```jsx
import AdminZoomDashboard from '../Components/Admin/AdminZoomDashboard';
import UserZoomDashboard from '../Components/User/UserZoomDashboard';
```

### 2. Admin Dashboard Implementation

```jsx
// In your admin page/route
function AdminPage() {
  const currentAdmin = {
    id: 'admin_123',
    name: 'Dr. Jane Doe',
    email: 'jane.doe@university.edu',
    role: 'admin',
    department: 'Computer Science'
  };

  return <AdminZoomDashboard currentUser={currentAdmin} />;
}
```

### 3. User Dashboard Implementation

```jsx
// In your student/user page/route
function StudentPage() {
  const currentUser = {
    id: 'user_123',
    name: 'John Smith',
    email: 'john.smith@university.edu',
    studentId: 'STU2024001',
    department: 'Computer Science',
    role: 'student'
  };

  return <UserZoomDashboard currentUser={currentUser} />;
}
```

### 4. Integration with React Router

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/meetings" element={<AdminZoomDashboard />} />
        <Route path="/student/meetings" element={<UserZoomDashboard />} />
        <Route path="/zoom-demo" element={<ZoomDashboardExample />} />
      </Routes>
    </Router>
  );
}
```

## 🔧 Backend Requirements

The components expect these API endpoints to be available:

### Required Endpoints:
- `GET /api/zoom/meetings` - Get all meetings
- `POST /api/zoom/enhanced/create-meeting` - Create new meeting
- `PATCH /api/zoom/meeting/:id/end` - End a meeting
- `GET /api/zoom/meeting/:id/live-participants` - Get live participants
- `POST /api/zoom/track-link-click` - Track when user clicks join

### WebSocket Events:
- `participantJoined` - Real-time participant join events
- `participantLeft` - Real-time participant leave events
- `meetingStarted` - Meeting start notifications
- `meetingEnded` - Meeting end notifications

## 🎯 User Flow

### Admin Flow:
1. **Login** to admin dashboard
2. **Create Meeting** using the form dialog
3. **Copy join URL** to share with students
4. **Monitor participants** in real-time table
5. **End meeting** when done

### Student Flow:
1. **Login** to student dashboard
2. **View available meetings** in card grid
3. **Click "Join Live"** or "Join Meeting" button
4. **Zoom opens automatically** in new tab
5. **Attendance tracked** automatically

## 🔄 Real-time Features

### Admin Dashboard:
- ✅ **Live participant count** updates automatically
- ✅ **Participant join/leave** notifications
- ✅ **Student identification** from email matching
- ✅ **Duration tracking** in real-time
- ✅ **Attendance percentage** calculation

### User Dashboard:
- ✅ **Meeting status** updates (Live, Ready, Ended)
- ✅ **Join link tracking** for attendance
- ✅ **User profile** display
- ✅ **Meeting statistics** overview

## 🎨 Features

### Admin Dashboard Features:
- **Meeting Creation Dialog** with full settings
- **Real-time Participant Table** with live updates
- **Live Statistics Cards** (Total, Active, Students, Duration)
- **Meeting Status Management** (Start/End controls)
- **WebSocket Integration** for live updates
- **Participant Student Matching** automatically

### User Dashboard Features:
- **Meeting Cards Grid** with status indicators
- **One-click Join** with attendance tracking
- **User Profile Card** with student info
- **Meeting Statistics** overview
- **Help Section** with instructions
- **Responsive Design** for mobile/desktop

## 📱 Responsive Design

Both dashboards are fully responsive and work on:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (320px - 767px)

## 🎛️ Customization

### User Props:
```jsx
// Admin user object
{
  id: 'admin_123',
  name: 'Dr. Jane Doe',
  email: 'jane.doe@university.edu',
  role: 'admin',
  department: 'Computer Science'
}

// Student user object
{
  id: 'user_123',
  name: 'John Smith',
  email: 'john.smith@university.edu',
  studentId: 'STU2024001',
  department: 'Computer Science',
  role: 'student'
}
```

### Environment Variables:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🔧 Dependencies

Required Material-UI components:
```json
{
  "@mui/material": "^5.x.x",
  "@mui/icons-material": "^5.x.x",
  "socket.io-client": "^4.x.x",
  "date-fns": "^2.x.x"
}
```

## 🚦 Getting Started

1. **Copy the component files** to your project
2. **Install dependencies** listed above
3. **Set up backend API** with required endpoints
4. **Configure WebSocket** connection on backend
5. **Import and use** components in your routes
6. **Pass user props** to components
7. **Test the flow**: Admin creates → User joins → Live tracking

## 📊 Example Usage

See `ZoomDashboardExample.jsx` for a complete working example that demonstrates both dashboards with a view switcher.

Run the example page to see both dashboards in action and understand the complete user flow.

## 🎉 Ready to Use!

The components are fully functional and ready for integration into your existing authentication and routing system. They automatically connect to your backend API and provide real-time updates through WebSocket connections.
