import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeModeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationSystemProvider } from './context/NotificationSystem';
import { AuthProvider } from './context/AuthContext';
import SignInForm from './Pages/SignInForm';
import SignupForm from './Pages/SignupForm';
import MainDashboard from './Pages/MainDashboard';
import AdminDashboard from './Pages/AdminDashboard';
import ProtectedRoute from './Components/ProtectedRoute';
import RealTimeNotificationInit from './Components/RealTimeNotificationInit';
import ErrorBoundary from './Components/ErrorBoundary';
import QRAttendancePage from './Pages/QRAttendancePage';
import QRAttendanceForm from './Components/QRCode/QRAttendanceForm';
import './utils/chromeExtensionFix'; // Handle Chrome extension errors
import './utils/performanceMonitor'; // Initialize performance monitoring
import './utils/safeConsoleMonitor'; // Initialize safe console error monitoring
import './utils/authTest'; // Initialize auth debugging tools
import './utils/apiTest'; // Initialize API testing tools

// Wrapper component to handle root redirect based on role


function App() {
  const handleSignInSuccess = (username, role) => {
    // This function can be used for any post-login actions if needed
    console.log('Sign in successful:', { username, role });
  };

  return (
    <ErrorBoundary>
      <ThemeModeProvider>
        <NotificationProvider>
          <NotificationSystemProvider>
            <RealTimeNotificationInit />
            <AuthProvider>
              <Router>
                <Routes>
                {/* Public Routes */}
                <Route path="/signin" element={<SignInForm onSignInSuccess={handleSignInSuccess} />} />
                <Route path="/signup" element={<SignupForm />} />
                
                {/* QR Attendance Routes (Public Access) */}
                <Route path="/qr-scan" element={<QRAttendanceForm />} />
                <Route path="/qr-attendance" element={<QRAttendancePage />} />

                {/* Protected Routes */}
                <Route
                  path="/admin-dashboard/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                      <MainDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Root redirect */}
                 {/* Redirect root to signin */}
                <Route path="/" element={<Navigate to="/signin" replace />} />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/signin" replace />} />
                </Routes>
              </Router>
            </AuthProvider>
          </NotificationSystemProvider>
        </NotificationProvider>
      </ThemeModeProvider>
    </ErrorBoundary>
  );
}

export default App;
