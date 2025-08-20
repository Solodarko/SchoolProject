import React from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Swal from 'sweetalert2';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Show a confirmation dialog before logging out
    Swal.fire({
      title: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear cookies
        Cookies.remove('authToken', { path: '/' });
        Cookies.remove('userRole', { path: '/' });
        Cookies.remove('username', { path: '/' });

        // Show a success message
        Swal.fire(
          'Logged Out!',
          'You have been successfully logged out.',
          'success'
        );

        // Redirect to the sign-in page
        navigate('/signin', { replace: true });
      }
    });
  };

  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={handleLogout}
      startIcon={<LogoutIcon />}
      sx={{
        margin: 2,
        backgroundColor: '#f44336',
        '&:hover': {
          backgroundColor: '#d32f2f',
        },
      }}
    >
      Logout
    </Button>
  );
};

export default LogoutButton; 