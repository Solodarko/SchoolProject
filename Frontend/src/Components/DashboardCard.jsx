import { Paper, Typography, Box, Grow, Stack, Chip, useTheme, alpha } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

export default function DashboardCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'primary', 
  children, 
  sx 
}) {
  const theme = useTheme();

  // If legacy usage (with children), render as before
  if (children && !value && !icon) {
    return (
      <Grow in={true} timeout={500}>
        <Paper elevation={1} sx={{ p: 3, borderRadius: 3, minHeight: 120, ...sx }}>
          {title && (
            <Box mb={2}>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                {title}
              </Typography>
            </Box>
          )}
          {children}
        </Paper>
      </Grow>
    );
  }

  // New metrics card layout
  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main
  };

  const cardColor = colorMap[color] || theme.palette.primary.main;
  const isPositiveTrend = trend > 0;
  const trendColor = isPositiveTrend ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Grow in={true} timeout={500}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 3, 
          minHeight: 140,
          background: `linear-gradient(135deg, ${alpha(cardColor, 0.05)} 0%, ${alpha(cardColor, 0.02)} 100%)`,
          border: `1px solid ${alpha(cardColor, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(cardColor, 0.2)}`,
          },
          ...sx 
        }}
      >
        {/* Background Icon */}
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            opacity: 0.1,
            transform: 'scale(2)',
            color: cardColor,
            zIndex: 0
          }}
        >
          {icon}
        </Box>

        {/* Content */}
        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ color: cardColor, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
            {trend !== undefined && (
              <Chip
                icon={isPositiveTrend ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${isPositiveTrend ? '+' : ''}${trend}%`}
                size="small"
                sx={{
                  bgcolor: alpha(trendColor, 0.1),
                  color: trendColor,
                  fontWeight: 'bold',
                  '& .MuiChip-icon': {
                    color: trendColor
                  }
                }}
              />
            )}
          </Stack>

          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              fontWeight={700} 
              sx={{ 
                color: 'text.primary',
                mt: 0.5,
                background: `linear-gradient(45deg, ${cardColor}, ${alpha(cardColor, 0.7)})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textFillColor: 'transparent'
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Grow>
  );
}
