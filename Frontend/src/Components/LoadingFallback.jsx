import { Box, CircularProgress } from "@mui/material";

function LoadingFallback() {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  export default LoadingFallback; 