import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import Cookies from 'js-cookie';
import { API_ENDPOINTS, createApiRequest } from '../config/api';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authToken = Cookies.get('authToken');
        const userRole = Cookies.get('userRole');    

        if (!authToken) {
          console.log('No auth token found in cookies');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Call backend to verify token validity and role
        const response = await createApiRequest(API_ENDPOINTS.AUTH.VERIFY, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
        // Check role consistency between token response and cookie
          if (data.user && data.user.role === userRole) {
            setIsAuthenticated(true);
             console.log(`ProtectedRoute: User '${data.user.username}' (Role: ${data.user.role}) authenticated.`);
          } else {
             console.log('ProtectedRoute: Role mismatch or user data missing from token verification - clearing auth data');
            // console.log('Role mismatch between token and cookie - clearing auth data');
            clearAuthCookies();
            setIsAuthenticated(false);
          }
        } else {
          // console.log('Token verification failed - clearing auth data');
          clearAuthCookies();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        clearAuthCookies();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    const clearAuthCookies = () => {
      Cookies.remove('authToken', { path: '/' });
      Cookies.remove('userRole', { path: '/' });
      Cookies.remove('username', { path: '/' });
    };

    verifyAuth();
  }, [location]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
 const userRole = Cookies.get('userRole'); // Get current role from cookie for final check
  
  // Redirect unauthenticated users to sign-in page
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Redirecting to signin because authentication failed.');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If no role restrictions, allow access to any authenticated user
  if (allowedRoles.length === 0) {
    console.log('ProtectedRoute: No role restrictions, access granted.');
    return children;
  }

  // If user role not allowed, redirect to their appropriate dashboard
  if (!allowedRoles.includes(userRole)) {
    console.log(`ProtectedRoute: User role '${userRole}' not allowed for this route, redirecting accordingly.`);
    // Redirect to a specific dashboard based on their actual role
    return <Navigate to={userRole === 'admin' ? '/admin-dashboard' : '/dashboard'} replace />;
  }

  // All checks passed, render protected content
  console.log('ProtectedRoute: Access granted to protected route.');
  return children;
};


export default ProtectedRoute;
