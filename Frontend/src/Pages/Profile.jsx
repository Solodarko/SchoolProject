import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Avatar, CircularProgress, Alert, Chip, Stack, Divider } from '@mui/material';
import Cookies from 'js-cookie';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getUserFullInfo } from '../utils/jwtUtils';

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const fullUserInfo = getUserFullInfo();
      
      if (fullUserInfo && fullUserInfo.username !== 'Unknown') {
        setUserInfo(fullUserInfo);
      } else {
        setError('User information not found. Please log in again.');
      }
    } catch (e) {
      console.error('Error retrieving user data:', e);
      setError('Failed to retrieve user data. Please try logging in again.');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Card sx={{ maxWidth: 700, margin: 'auto', mt: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {/* User Avatar and Name */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'secondary.main' }}>
              <AccountCircleIcon sx={{ fontSize: 80 }} />
            </Avatar>
            <Typography variant="h5" component="div" gutterBottom>
              {userInfo?.username || 'Unknown User'}
            </Typography>
            <Chip 
              icon={userInfo?.role === 'admin' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
              label={userInfo?.role?.toUpperCase() || 'USER'}
              color={userInfo?.role === 'admin' ? 'primary' : 'default'}
              variant="outlined"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* User Information */}
          <Stack spacing={3}>
            {/* Email */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email:
                </Typography>
                <Typography variant="body1">
                  {userInfo?.email || 'Not available'}
                </Typography>
              </Box>
            </Box>

            {/* Username */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Username:
                </Typography>
                <Typography variant="body1">
                  {userInfo?.username || 'Not available'}
                </Typography>
              </Box>
            </Box>

            {/* User ID */}
            {userInfo?.userId && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    User ID:
                  </Typography>
                  <Typography variant="body1">
                    {userInfo.userId}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Token Expiration */}
            {userInfo?.expiresAt && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTimeIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Session Expires:
                  </Typography>
                  <Typography variant="body1">
                    {userInfo.expiresAt.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Additional Info */}
          <Typography variant="body2" color="text.secondary" textAlign="center">
            This profile information is retrieved from your authentication token.
            {userInfo?.email ? ' Your email is now properly displayed from the token.' : ' Email may not be available if not included in the token.'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile; 