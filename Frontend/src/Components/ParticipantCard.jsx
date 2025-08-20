import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Badge,
  Divider,
  Stack,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Warning,
  Schedule,
  Stop,
  History,
  Person,
  Email,
  AccessTime,
  Timer,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ParticipantCard = ({
  participant,
  meetingConfig,
  onEndAttendance,
  onViewDetails,
  isActive = false,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Left Early': return 'warning';
      case 'In Progress': return 'primary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present': return <CheckCircle />;
      case 'Absent': return <Cancel />;
      case 'Left Early': return <Warning />;
      case 'In Progress': return <Schedule />;
      default: return <Warning />;
    }
  };

  const getAvatarColor = () => {
    if (participant.isExternal) {
      return participant.isActive ? 'secondary.main' : 'secondary.light';
    }
    return participant.isActive ? 'success.main' : 'grey.400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card
        sx={{
          height: '100%',
          borderLeft: participant.isActive ? '4px solid' : 'none',
          borderLeftColor: participant.isActive ? 'primary.main' : 'transparent',
          background: participant.isActive
            ? 'linear-gradient(135deg, rgba(45, 140, 255, 0.02) 0%, rgba(45, 140, 255, 0.05) 100%)'
            : 'white',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {participant.isActive && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 12,
              height: 12,
              bgcolor: 'success.main',
              borderRadius: '50%',
              border: '2px solid white',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
            }}
          />
        )}

        <CardContent sx={{ p: 3 }}>
          {/* Header with Avatar and Basic Info */}
          <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                participant.isExternal ? (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: 'secondary.main',
                      borderRadius: '50%',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'white' }}>
                      E
                    </Typography>
                  </Box>
                ) : null
              }
            >
              <Avatar
                sx={{
                  bgcolor: getAvatarColor(),
                  width: 56,
                  height: 56,
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  border: participant.isExternal ? '2px solid' : 'none',
                  borderColor: 'secondary.main',
                }}
              >
                {participant.name.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>

            <Box flex={1}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {participant.name}
              </Typography>
              <Stack spacing={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {participant.email || 'No email provided'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    ID: {participant.participantId}
                    {participant.isExternal && (
                      <Chip
                        label="External"
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Status Chip */}
            <Chip
              icon={getStatusIcon(participant.attendanceStatus)}
              label={participant.attendanceStatus}
              color={getStatusColor(participant.attendanceStatus)}
              variant="filled"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.75rem',
              }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Timing Information */}
          <Box mb={2}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Joined
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {participant.joinTime.toLocaleTimeString()}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <Timer sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {participant.duration} min
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Progress Bar */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Attendance Progress
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary.main">
                {participant.attendancePercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={participant.attendancePercentage}
              color={
                participant.attendancePercentage >= meetingConfig.attendanceThreshold
                  ? 'success'
                  : 'warning'
              }
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(0, 0, 0, 0.1)',
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box display="flex" gap={1} justifyContent="flex-end">
            {participant.isActive && (
              <Tooltip title="End attendance">
                <IconButton
                  onClick={() => onEndAttendance(participant)}
                  color="error"
                  size="small"
                  sx={{
                    bgcolor: 'error.light',
                    color: 'error.contrastText',
                    '&:hover': {
                      bgcolor: 'error.main',
                    },
                  }}
                >
                  <Stop fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="View details">
              <IconButton
                onClick={() => onViewDetails(participant)}
                color="primary"
                size="small"
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                }}
              >
                <History fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ParticipantCard;
