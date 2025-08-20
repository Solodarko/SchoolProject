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
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Container,
  Avatar,
  LinearProgress,
  Divider,
  Slide,
  useTheme,
  alpha,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Email, 
  Lock, 
  Google, 
  Facebook, 
  GitHub, 
  CheckCircle
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { useThemeMode } from '../context/ThemeContext';
import { API_ENDPOINTS, createApiRequest } from '../config/api';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'user',
  });
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

    // Validate form inputs
    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createApiRequest(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Welcome!',
          text: 'Account created successfully. Redirecting to sign in...',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          navigate('/SignInForm');
        });
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          title="Create Account"
          subheader="Join us today"
          titleTypographyProps={{ variant: 'h5', fontWeight: 'bold' }}
          sx={{ textAlign: 'center', pb: 1 }}
        />
        <CardContent sx={{ px: 3, pb: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={formData.username}
                onChange={handleChange('username')}
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
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
            <Box mb={3}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={handleChange('password')}
                disabled={loading}
                size="medium"
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
                        edge="end"
                        disabled={loading}
                        size="small"
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
                Select Role
              </Typography>
              <RadioGroup
                value={formData.role}
                onChange={handleChange('role')}
                disabled={loading}
                row
                sx={{
                  justifyContent: 'space-around',
                  '& .MuiFormControlLabel-root': {
                    margin: 0,
                    flex: 1,
                    justifyContent: 'center',
                  },
                  '& .MuiRadio-root': {
                    color: theme.palette.primary.main,
                    '&.Mui-checked': {
                      color: theme.palette.primary.main,
                    },
                  },
                }}
              >
                <FormControlLabel
                  value="user"
                  control={<Radio />}
                  label="Normal User"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.9rem',
                      fontWeight: 'medium',
                    },
                  }}
                />
                <FormControlLabel
                  value="admin"
                  control={<Radio />}
                  label="Admin"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.9rem',
                      fontWeight: 'medium',
                    },
                  }}
                />
              </RadioGroup>
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
              size="large"
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center', pt: 0, pb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?
            <Link to="/SignInForm" style={{ 
              color: theme.palette.primary.main, 
              textDecoration: 'none', 
              fontWeight: 'bold',
              marginLeft: '6px',
              transition: 'all 0.2s ease-in-out'
            }}>
              Sign In
            </Link>
          </Typography>
        </CardActions>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
};

export default SignupForm;
