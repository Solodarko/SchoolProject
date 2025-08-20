import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Container,
  Slide,
  useTheme,
  alpha,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Visibility, 
  VisibilityOff,
  Email,
  Lock
} from '@mui/icons-material';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import PropTypes from 'prop-types';
import { useThemeMode } from '../context/ThemeContext';
import { API_ENDPOINTS, createApiRequest } from '../config/api';

const SignInForm = ({ onSignInSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode } = useThemeMode();

  // Handle form input changes
  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (error) setError(''); // Clear error when user starts typing
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      
      
      return;
    }

    setLoading(true);
    setError('');

    try {

      const response = await createApiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Sign in failed' }));

        if (response.status === 401) {
          setError('Invalid email or password');
          Swal.fire({ 
            icon: 'error',
            title: 'Authentication Failed',
            text: 'Invalid email or password.',
          });
          return;
        }

       
        throw new Error(errorData.message || 'Sign in failed due to server error.');
      }

      const result = await response.json();
      if (!result.token) {
        throw new Error('Authentication token not provided by server.');
      }
      if (!result.role) {
        throw new Error('User role not provided by server.');
      }
      if (!result.username) {
        throw new Error('Username not provided by server.');
      }

      Cookies.set('authToken', result.token, {
        expires: 7, 
        secure: false,
        sameSite: 'Lax', 
        path: '/',
      });
      Cookies.set('userRole', result.role, { expires: 7, path: '/' });
      Cookies.set('username', result.username, { expires: 7, path: '/' });

      
      const tokenSet = Cookies.get('authToken');
      if (!tokenSet) {
        throw new Error('Failed to set authentication token in browser cookies.');
      }

      // Passing only username and role to match the handleSignInSuccess signature in App.js
      if (onSignInSuccess) {
        onSignInSuccess(result.username, result.role);
      }

      // Welcome message using SweetAlert2
      Swal.fire({ 
        icon: 'success',
        title: `Welcome, ${result.username}!`,
        text: `You are signed in as ${result.role}.`,
      });

      // Navigate based on role
      if (result.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (err) {
      console.error('Sign in error:', err.message);
      setError(err.message);
      Swal.fire({ 
        icon: 'error',
        title: 'Login Error',
        text: err.message || 'An unexpected error occurred during sign in.',
      });
    } finally {
      setLoading(false);
    }
  };

return (
    <Box 
      sx={{ 
        background: mode === 'light'
          ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
          : `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 1, sm: 2 },
        margin: 0,
        transition: 'all 0.3s ease-in-out',
      }} 
    >
      <Container 
        maxWidth="sm" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          py: 2
        }}
      >
        <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={800}>
          <Card sx={{
            width: { xs: '90%', sm: 400, md: 420 },
            maxWidth: 420,
            borderRadius: 3,
            boxShadow: mode === 'light'
              ? '0 20px 60px rgba(0,0,0,0.12)'
              : '0 20px 60px rgba(0,0,0,0.4)',
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: mode === 'light'
                ? '0 25px 80px rgba(0,0,0,0.15)'
                : '0 25px 80px rgba(0,0,0,0.5)', 
              transform: 'translateY(-2px)', 
            },
          }}
            elevation={0}
          >
        <CardHeader 
          title="Sign In"
          subheader="Welcome back! Please log in."
          titleTypographyProps={{ variant: 'h5', fontWeight: 'bold' }}
          sx={{ textAlign: 'center', pb: 1 }}
        />
        <CardContent sx={{ px: 3, pb: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={handleChange('email')}
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={handleChange('password')}
                disabled={loading}
                size="medium"
                autoComplete="current-password"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& input': {
                      color: 'inherit',
                      '&:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.1) inset',
                        WebkitTextFillColor: 'inherit',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        disabled={loading}
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                        sx={{
                          color: 'inherit',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                background: mode === 'light'
                  ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                  : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                '&:hover': {
                  background: mode === 'light'
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.main})`
                    : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transform: 'translateY(-1px)',
                  boxShadow: mode === 'light'
                    ? '0 8px 25px rgba(37, 99, 235, 0.3)'
                    : '0 8px 25px rgba(59, 130, 246, 0.4)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center', pt: 0, pb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?
            <Link to="/signup" style={{ 
              color: theme.palette.primary.main, 
              textDecoration: 'none', 
              fontWeight: 'bold',
              marginLeft: '6px',
              transition: 'all 0.2s ease-in-out'
            }}>
              Sign Up
            </Link>
          </Typography>
        </CardActions>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
};

SignInForm.propTypes = {
  onSignInSuccess: PropTypes.func.isRequired,
};

export default SignInForm;