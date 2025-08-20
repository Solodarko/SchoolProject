import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line, Doughnut, Radar, Pie } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  People,
  Schedule,
  Analytics,
  Star,
  Warning,
  CheckCircle,
  Timer,
  Assessment,
  Leaderboard,
  EmojiEvents,
  Download,
  Refresh,
  FilterList,
  DateRange
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale
);

const AttendanceAnalytics = ({ participants = [], meetingHistory = [], participantInsights = {} }) => {
  const theme = useTheme();
  const [timeFrame, setTimeFrame] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('attendance');

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    // Attendance trends over time
    const attendanceTrends = meetingHistory.slice(-10).map(meeting => ({
      date: new Date(meeting.date).toLocaleDateString(),
      attendance: meeting.averageAttendance,
      totalParticipants: meeting.totalParticipants,
      presentCount: meeting.presentCount
    }));

    // Top performers
    const topPerformers = Object.values(participantInsights)
      .filter(insight => insight.totalMeetings >= 3)
      .sort((a, b) => b.averageAttendance - a.averageAttendance)
      .slice(0, 10);

    // Meeting effectiveness scores
    const effectivenessScores = meetingHistory.map(meeting => ({
      topic: meeting.topic,
      attendanceRate: meeting.averageAttendance,
      participationScore: Math.min(100, (meeting.presentCount / meeting.totalParticipants) * 100),
      effectivenessScore: Math.round((meeting.averageAttendance + (meeting.presentCount / meeting.totalParticipants * 100)) / 2)
    }));

    // Attendance distribution
    const attendanceDistribution = {
      present: participants.filter(p => p.attendanceStatus === 'Present').length,
      leftEarly: participants.filter(p => p.attendanceStatus === 'Left Early').length,
      absent: participants.filter(p => p.attendanceStatus === 'Absent').length,
      inProgress: participants.filter(p => p.attendanceStatus === 'In Progress').length
    };

    // Engagement metrics
    const engagementMetrics = participants.map(p => ({
      name: p.name,
      duration: p.duration || 0,
      percentage: p.attendancePercentage || 0,
      status: p.attendanceStatus,
      grade: p.attendanceGrade || 'N/A'
    }));

    return {
      attendanceTrends,
      topPerformers,
      effectivenessScores,
      attendanceDistribution,
      engagementMetrics
    };
  }, [participants, meetingHistory, participantInsights]);

  // Chart configurations
  const attendanceTrendData = {
    labels: analyticsData.attendanceTrends.map(trend => trend.date),
    datasets: [
      {
        label: 'Attendance %',
        data: analyticsData.attendanceTrends.map(trend => trend.attendance),
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Participants',
        data: analyticsData.attendanceTrends.map(trend => trend.totalParticipants),
        borderColor: theme.palette.secondary.main,
        backgroundColor: `${theme.palette.secondary.main}20`,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const attendanceDistributionData = {
    labels: ['Present', 'Left Early', 'Absent', 'In Progress'],
    datasets: [
      {
        data: [
          analyticsData.attendanceDistribution.present,
          analyticsData.attendanceDistribution.leftEarly,
          analyticsData.attendanceDistribution.absent,
          analyticsData.attendanceDistribution.inProgress
        ],
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main
        ]
      }
    ]
  };

  const effectivenessData = {
    labels: analyticsData.effectivenessScores.map(score => score.topic.substring(0, 15) + '...'),
    datasets: [
      {
        label: 'Effectiveness Score',
        data: analyticsData.effectivenessScores.map(score => score.effectivenessScore),
        backgroundColor: `${theme.palette.success.main}80`,
        borderColor: theme.palette.success.main,
        borderWidth: 1
      }
    ]
  };

  const performanceRadarData = {
    labels: ['Attendance Rate', 'Punctuality', 'Consistency', 'Engagement', 'Participation'],
    datasets: analyticsData.topPerformers.slice(0, 3).map((performer, index) => ({
      label: performer.name,
      data: [
        performer.averageAttendance,
        Math.max(0, 100 - (performer.lateCount / performer.totalMeetings * 100)),
        Math.min(100, performer.currentStreak * 10),
        Math.min(100, performer.averageAttendance + 10),
        Math.min(100, performer.totalMeetings * 5)
      ],
      backgroundColor: `${[theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main][index]}20`,
      borderColor: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main][index],
      pointBackgroundColor: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main][index]
    }))
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          📊 Attendance Analytics Dashboard
        </Typography>
        
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Frame</InputLabel>
            <Select
              value={timeFrame}
              label="Time Frame"
              onChange={(e) => setTimeFrame(e.target.value)}
            >
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="quarter">Quarter</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              label="Metric"
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <MenuItem value="attendance">Attendance</MenuItem>
              <MenuItem value="engagement">Engagement</MenuItem>
              <MenuItem value="punctuality">Punctuality</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {
              // Export analytics data
              const data = JSON.stringify(analyticsData, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'attendance-analytics.json';
              a.click();
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{participants.length}</Typography>
              <Typography variant="body2">Total Participants</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">
                {Math.round(analyticsData.attendanceTrends.reduce((sum, trend) => sum + trend.attendance, 0) / analyticsData.attendanceTrends.length || 0)}%
              </Typography>
              <Typography variant="body2">Avg Attendance</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Timer sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{meetingHistory.length}</Typography>
              <Typography variant="body2">Total Meetings</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">
                {analyticsData.effectivenessScores.length > 0 
                  ? Math.round(analyticsData.effectivenessScores.reduce((sum, score) => sum + score.effectivenessScore, 0) / analyticsData.effectivenessScores.length)
                  : 0}%
              </Typography>
              <Typography variant="body2">Effectiveness</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Attendance Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Attendance Trends Over Time
              </Typography>
              <Box sx={{ height: 400 }}>
                {analyticsData.attendanceTrends.length > 0 ? (
                  <Line data={attendanceTrendData} options={chartOptions} />
                ) : (
                  <Alert severity="info">No trend data available</Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🥧 Attendance Distribution
              </Typography>
              <Box sx={{ height: 400 }}>
                <Doughnut data={attendanceDistributionData} options={{ responsive: true, maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Meeting Effectiveness */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Meeting Effectiveness Scores
              </Typography>
              <Box sx={{ height: 300 }}>
                {analyticsData.effectivenessScores.length > 0 ? (
                  <Bar data={effectivenessData} options={{ ...chartOptions, scales: { y: { beginAtZero: true, max: 100 } } }} />
                ) : (
                  <Alert severity="info">No effectiveness data available</Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Radar */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Top Performer Analysis
              </Typography>
              <Box sx={{ height: 300 }}>
                {analyticsData.topPerformers.length > 0 ? (
                  <Radar data={performanceRadarData} options={radarOptions} />
                ) : (
                  <Alert severity="info">Need at least 3 meetings per participant for analysis</Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performers Table */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Top Performers Leaderboard
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Participant</TableCell>
                    <TableCell>Attendance Rate</TableCell>
                    <TableCell>Meetings</TableCell>
                    <TableCell>Current Streak</TableCell>
                    <TableCell>Grade</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.topPerformers.slice(0, 10).map((performer, index) => (
                    <TableRow key={performer.email}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {index < 3 && <EmojiEvents color={index === 0 ? 'warning' : index === 1 ? 'disabled' : 'error'} />}
                          #{index + 1}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {performer.name.charAt(0)}
                          </Avatar>
                          {performer.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {performer.averageAttendance}%
                          <LinearProgress
                            variant="determinate"
                            value={performer.averageAttendance}
                            sx={{ width: 50, height: 6 }}
                            color={performer.averageAttendance >= 90 ? 'success' : performer.averageAttendance >= 75 ? 'warning' : 'error'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{performer.totalMeetings}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${performer.currentStreak} meetings`}
                          color={performer.currentStreak >= 5 ? 'success' : performer.currentStreak >= 3 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={performer.averageAttendance >= 95 ? 'A+' : performer.averageAttendance >= 90 ? 'A' : performer.averageAttendance >= 80 ? 'B' : performer.averageAttendance >= 70 ? 'C' : 'D'}
                          color={performer.averageAttendance >= 90 ? 'success' : performer.averageAttendance >= 75 ? 'warning' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {analyticsData.topPerformers.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No participant data available. Need at least 3 meetings per participant for leaderboard.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Insights Panel */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 Key Insights
              </Typography>
              <List dense>
                {analyticsData.attendanceTrends.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      {analyticsData.attendanceTrends[analyticsData.attendanceTrends.length - 1]?.attendance > 
                       analyticsData.attendanceTrends[0]?.attendance ? 
                       <TrendingUp color="success" /> : <TrendingDown color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Attendance Trend"
                      secondary={
                        analyticsData.attendanceTrends[analyticsData.attendanceTrends.length - 1]?.attendance > 
                        analyticsData.attendanceTrends[0]?.attendance
                          ? "Improving over time" 
                          : "Declining trend detected"
                      }
                    />
                  </ListItem>
                )}
                
                <ListItem>
                  <ListItemIcon>
                    <Star color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Best Performer"
                    secondary={analyticsData.topPerformers[0]?.name || "No data available"}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Assessment color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Most Effective Meeting"
                    secondary={
                      analyticsData.effectivenessScores.length > 0
                        ? analyticsData.effectivenessScores.reduce((max, score) => 
                            score.effectivenessScore > max.effectivenessScore ? score : max
                          ).topic
                        : "No meetings analyzed"
                    }
                  />
                </ListItem>
                
                {participants.filter(p => p.attendancePercentage < 50).length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="At-Risk Participants"
                      secondary={`${participants.filter(p => p.attendancePercentage < 50).length} participants below 50%`}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AttendanceAnalytics;
