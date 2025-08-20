import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboardOverview from './AdminDashboardOverview';
import UserManagement from './UserManagement';
import AdminAnalytics from './AdminAnalytics';
import AttendanceLogs from './AttendanceLogs';
// Enhanced admin components
import EnhancedStudentManagement from '../Components/EnhancedStudentManagement';
import ViewStudents from '../Components/ViewStudents';
import AddStudents from '../Components/AddStudents';
import AttendanceTrends from '../Components/AttendanceTrends';
import UnifiedReports from '../Components/UnifiedReports';
import EnhancedZoomDashboard from '../Components/Zoom/EnhancedZoomDashboard';
import MeetingAnalytics from '../Components/MeetingAnalytics';
import MeetingManagement from '../Components/MeetingManagement';
import QRCodeGenerator from './QRCodeGenerator';
import EnhancedAttendanceTrackerDashboard from '../Components/Admin/EnhancedAttendanceTrackerDashboard';
import EnhancedAdminAttendanceDashboard from '../Components/Admin/EnhancedAdminAttendanceDashboard';
import RebuildMeetingParticipants from '../Components/Admin/RebuildMeetingParticipants';
import AdminTools from '../Components/AdminTools';
import UnifiedAdminAnalytics from '../Components/Admin/UnifiedAdminAnalytics';
import JoinTrackingDashboard from '../Components/Admin/JoinTrackingDashboard';
import AdminMeetingTablePage from '../Components/Admin/AdminMeetingTablePage';
import ZoomAttendanceDurationTracker from '../Components/Admin/ZoomAttendanceDurationTracker';
import AttendanceDataDebugger from '../Components/Admin/AttendanceDataDebugger';

// Placeholder components for remaining features
const RoleManagement = () => <div>Role Management Page - Coming Soon</div>;
const SecuritySettings = () => <div>Security Settings Page - Coming Soon</div>;

const AdminDashboardRoutes = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboardOverview />} />
      <Route path="/dashboard" element={<AdminDashboardOverview />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/roles" element={<RoleManagement />} />
      <Route path="/analytics" element={<UnifiedAdminAnalytics />} />
      <Route path="/attendance" element={<AttendanceLogs />} />
      <Route path="/meeting-management" element={<MeetingManagement />} />
      <Route path="/zoom-integration" element={<EnhancedZoomDashboard />} />
      <Route path="/qr-generator" element={<QRCodeGenerator />} />
      <Route path="/meeting-analytics" element={<MeetingAnalytics />} />
      <Route path="/reports" element={<UnifiedReports />} />
      <Route path="/view-students" element={<ViewStudents />} />
      <Route path="/add-students" element={<AddStudents />} />
      <Route path="/manage-students" element={<EnhancedStudentManagement />} />
      <Route path="/attendance-trends" element={<AttendanceTrends />} />
      <Route path="/enhanced-attendance-tracker" element={<EnhancedAttendanceTrackerDashboard />} />
      <Route path="/enhanced-admin-attendance" element={<AdminMeetingTablePage />} />
      <Route path="/meeting-participants" element={<AdminMeetingTablePage />} />
      <Route path="/join-tracking" element={<JoinTrackingDashboard />} />
      <Route path="/attendance-tracker" element={<ZoomAttendanceDurationTracker />} />
      <Route path="/debug-attendance" element={<AttendanceDataDebugger />} />
      <Route path="/security" element={<SecuritySettings />} />
      <Route path="/admin-tools" element={<AdminTools />} />
    </Routes>
  );
};

export default AdminDashboardRoutes;
