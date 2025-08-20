import { useState, useEffect } from "react";
import { Avatar, Menu, MenuItem, IconButton, Tooltip, Divider, Typography, Box } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Swal from "sweetalert2";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Person as PersonIcon } from '@mui/icons-material';
import { getUserFullInfo } from '../utils/jwtUtils';

const ProfileMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const open = Boolean(anchorEl);
  
  useEffect(() => {
    const fullUserInfo = getUserFullInfo();
    setUserInfo(fullUserInfo);
  }, []);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out!'
    }).then((result) => {
      if (result.isConfirmed) {
        Cookies.remove('authToken', { path: '/' });
        Cookies.remove('userRole', { path: '/' });
        Cookies.remove('username', { path: '/' });
        navigate('/signin', { replace: true });
        Swal.fire('Logged Out!', 'You have been logged out successfully.', 'success');
      }
    });
  };

  const handleProfile = () => {
    handleClose();
    navigate('/dashboard/profile');
  };

  return (
    <div>
      <Tooltip title="Account settings">
        <IconButton onClick={handleMenu} size="small" sx={{ ml: 2 }}>
          <Avatar sx={{ width: 32, height: 32 }}><PersonIcon /></Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{ mt: 1.5 }}
      >
        <Box sx={{ p: 2, minWidth: 250 }}>
          <Typography variant="body2" color="text.secondary">Welcome,</Typography>
          <Typography variant="subtitle1" fontWeight="medium">
            {userInfo?.username || 'User'}
          </Typography>
          {userInfo?.email && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Email: {userInfo.email}
            </Typography>
          )}
        </Box>
        <Divider />
        <MenuItem onClick={handleProfile}>
          <AccountCircleIcon sx={{ mr: 1 }} /> 
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} /> 
          Logout
        </MenuItem>
      </Menu>
    </div>
  );
};

export default ProfileMenu; 