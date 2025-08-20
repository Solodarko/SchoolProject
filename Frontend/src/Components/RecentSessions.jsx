
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const sessions = [
  {
    id: 1,
    className: 'Computer Science 101',
    date: '2024-06-01',
    time: '09:00 AM',
    totalStudents: 35,
    present: 32,
    absent: 3,
    status: 'completed',
  },
  {
    id: 2,
    className: 'Mathematics 201',
    date: '2024-06-01',
    time: '11:00 AM',
    totalStudents: 28,
    present: 26,
    absent: 2,
    status: 'completed',
  },
  {
    id: 3,
    className: 'Physics 301',
    date: '2024-06-01',
    time: '02:00 PM',
    totalStudents: 24,
    present: 22,
    absent: 2,
    status: 'ongoing',
  },
  {
    id: 4,
    className: 'Chemistry 201',
    date: '2024-06-01',
    time: '04:00 PM',
    totalStudents: 30,
    present: 0,
    absent: 0,
    status: 'scheduled',
  },
];

function getStatusChip(status) {
  switch (status) {
    case 'completed':
      return <Chip label="Completed" color="success" size="small" />;
    case 'ongoing':
      return <Chip label="Ongoing" color="primary" size="small" />;
    case 'scheduled':
      return <Chip label="Scheduled" color="default" size="small" />;
    default:
      return <Chip label="Unknown" size="small" />;
  }
}

function getAttendanceRate(present, total) {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export function RecentSessions() {
  return (
    <Card elevation={3}>
      <CardHeader
        avatar={<AccessTimeIcon color="primary" />}
        title={<Typography variant="h6">Recent Sessions</Typography>}
      />
      <CardContent>
        <Stack spacing={2}>
          {sessions.map((session) => (
            <Box
              key={session.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: 'grey.100',
                '&:hover': { bgcolor: 'grey.200' },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ mr: 1 }}>
                    {session.className}
                  </Typography>
                  {getStatusChip(session.status)}
                </Box>
                <Stack direction="row" spacing={3} sx={{ color: 'text.secondary' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{session.time}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {session.totalStudents} students
                    </Typography>
                  </Box>
                  {session.status !== 'scheduled' && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">{session.present} present</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CancelIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">{session.absent} absent</Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                {session.status !== 'scheduled' && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {getAttendanceRate(session.present, session.totalStudents)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      attendance
                    </Typography>
                  </Box>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityIcon />}
                >
                  View
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
