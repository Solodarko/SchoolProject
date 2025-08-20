import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: 'grey.100', p: 3 }}
    >
      <Typography variant="h3" color="error" gutterBottom>
        Access Denied
      </Typography>
      <Typography variant="h6" color="textSecondary" align="center" sx={{ mb: 4 }}>
        You do not have the necessary permissions to view this page.
      </Typography>
      <Button
        component={Link}
        to="/signin"
        variant="contained"
        color="primary"
        sx={{ mr: 2 }}
      >
        Go to Sign In
      </Button>
      <Button
        component={Link}
        to="/" // Or redirect to a safe general landing page
        variant="outlined"
        color="secondary"
      >
        Back to Home
      </Button>
    </Box>
  );
};

export default UnauthorizedPage;