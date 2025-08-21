import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

import AnalyticsDashboard from './Dashboard';
import EnhancedDashboardContent from '../Components/EnhancedDashboardContent';
import StudentForm from '../Components/StudentForm';
import StudentList from '../Components/StudentList';
import MaterialQRScanner from '../Components/MaterialQRScanner';
// User-focused componts
import UserAttendance from '../Components/UserAttendance';
import UserCourses from '../Components/UserCourses';
import UserReports from '../Components/UserReports';
// Profile component
import Profile from './Profile';
// Testing components
import SocketDebugger from '../Components/SocketDebugger';
import JWTTokenDebugger from '../Components/JWTTokenDebugger';
import UserZoomDashboard from '../Components/User/UserZoomDashboard';

const DashboardRoutes = () => {
  return (
    <Box sx={{ 
      width: '100%',
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0, // Allow content to shrink if needed
    }}>
      <Routes>
        <Route path="/" element={<EnhancedDashboardContent />} />
        <Route path="/dashboards" element={<EnhancedDashboardContent />} />
        <Route path="/students" element={<StudentForm />} />
        <Route path="/student" element={<StudentList />} />
        <Route path="/scan" element={<MaterialQRScanner />} />
        <Route path="/ZoomIntegration" element={<UserZoomDashboard />} />
        <Route path="/my-attendance" element={<UserAttendance />} />
        <Route path="/my-courses" element={<UserCourses />} />
        <Route path="/my-reports" element={<UserReports />} />
        <Route path="/profile" element={<Profile />} />
        {/* Testing routes */}
        <Route path="/socket-debug" element={<SocketDebugger />} />
        <Route path="/jwt-debug" element={<JWTTokenDebugger />} />
        {/* Add a catch-all route that redirects to dashboard */}
        <Route path="*" element={<EnhancedDashboardContent />} />
      </Routes>
    </Box>
  );
};

export default DashboardRoutes; 