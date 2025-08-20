import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Avatar,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  LinearProgress
} from '@mui/material';
import {
  GetApp,
  PictureAsPdf,
  TableChart,
  Email,
  DateRange,
  FilterList,
  Analytics,
  TrendingUp,
  People,
  Schedule,
  Assessment,
  Star,
  Warning,
  CheckCircle,
  ExpandMore,
  Refresh,
  Print,
  Share,
  Download,
  CloudDownload,
  FileDownload,
  Send
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AdvancedReporting = ({ participants = [], meetingHistory = [], participantInsights = {} }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  
  // Report filters
  const [reportFilters, setReportFilters] = useState({
    dateRange: 'last30days',
    startDate: '',
    endDate: '',
    reportType: 'summary',
    participants: 'all',
    meetings: 'all',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
    includeRecommendations: true
  });

  // Computed report data
  const reportData = useMemo(() => {
    const filteredMeetings = filterMeetingsByDateRange(meetingHistory);
    const filteredParticipants = getFilteredParticipants();
    
    return {
      summary: generateSummaryReport(filteredMeetings, filteredParticipants),
      attendance: generateAttendanceReport(filteredMeetings, filteredParticipants),
      performance: generatePerformanceReport(filteredParticipants),
      trends: generateTrendsReport(filteredMeetings),
      recommendations: generateRecommendations(filteredMeetings, filteredParticipants)
    };
  }, [meetingHistory, participantInsights, reportFilters]);

  const filterMeetingsByDateRange = (meetings) => {
    const now = new Date();
    let startDate, endDate;

    switch (reportFilters.dateRange) {
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'custom':
        startDate = new Date(reportFilters.startDate);
        endDate = new Date(reportFilters.endDate);
        break;
      default:
        return meetings;
    }

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate >= startDate && meetingDate <= endDate;
    });
  };

  const getFilteredParticipants = () => {
    if (reportFilters.participants === 'all') {
      return Object.values(participantInsights);
    }
    // Add specific participant filtering logic here
    return Object.values(participantInsights);
  };

  const generateSummaryReport = (meetings, participants) => {
    const totalMeetings = meetings.length;
    const totalParticipants = participants.length;
    const averageAttendance = meetings.reduce((sum, m) => sum + m.averageAttendance, 0) / Math.max(meetings.length, 1);
    const topPerformer = participants.sort((a, b) => b.averageAttendance - a.averageAttendance)[0];
    
    return {
      totalMeetings,
      totalParticipants,
      averageAttendance: Math.round(averageAttendance),
      topPerformer: topPerformer || { name: 'N/A', averageAttendance: 0 },
      meetingsThisWeek: meetings.filter(m => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(m.date) >= weekAgo;
      }).length,
      attendanceTrend: calculateAttendanceTrend(meetings)
    };
  };

  const generateAttendanceReport = (meetings, participants) => {
    const attendanceDistribution = {
      excellent: participants.filter(p => p.averageAttendance >= 95).length,
      good: participants.filter(p => p.averageAttendance >= 80 && p.averageAttendance < 95).length,
      average: participants.filter(p => p.averageAttendance >= 60 && p.averageAttendance < 80).length,
      poor: participants.filter(p => p.averageAttendance < 60).length
    };

    const punctualityData = {
      alwaysOnTime: participants.filter(p => (p.lateCount || 0) === 0).length,
      occasionallyLate: participants.filter(p => (p.lateCount || 0) > 0 && (p.lateCount || 0) <= 2).length,
      frequentlyLate: participants.filter(p => (p.lateCount || 0) > 2).length
    };

    return {
      attendanceDistribution,
      punctualityData,
      attendanceByMeeting: meetings.map(m => ({
        topic: m.topic,
        date: m.date,
        attendance: m.averageAttendance,
        participants: m.totalParticipants
      }))
    };
  };

  const generatePerformanceReport = (participants) => {
    const performanceMetrics = participants.map(participant => ({
      name: participant.name,
      email: participant.email,
      attendanceRate: participant.averageAttendance,
      totalMeetings: participant.totalMeetings,
      currentStreak: participant.currentStreak,
      bestStreak: participant.bestStreak,
      lateCount: participant.lateCount || 0,
      performance: getPerformanceRating(participant),
      trend: getPerformanceTrend(participant)
    })).sort((a, b) => b.attendanceRate - a.attendanceRate);

    return {
      topPerformers: performanceMetrics.slice(0, 10),
      needsImprovement: performanceMetrics.filter(p => p.attendanceRate < 70),
      consistentAttendees: performanceMetrics.filter(p => p.currentStreak >= 5),
      averagePerformanceScore: performanceMetrics.reduce((sum, p) => sum + p.performance.score, 0) / Math.max(performanceMetrics.length, 1)
    };
  };

  const generateTrendsReport = (meetings) => {
    const weeklyTrends = getWeeklyAttendanceTrends(meetings);
    const monthlyTrends = getMonthlyAttendanceTrends(meetings);
    
    return {
      weeklyTrends,
      monthlyTrends,
      busyDays: getBusiestDays(meetings),
      optimalTimes: getOptimalMeetingTimes(meetings),
      seasonalPatterns: getSeasonalPatterns(meetings)
    };
  };

  const generateRecommendations = (meetings, participants) => {
    const recommendations = [];

    // Low attendance recommendations
    const lowAttendanceMeetings = meetings.filter(m => m.averageAttendance < 70);
    if (lowAttendanceMeetings.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Low Attendance Alert',
        description: `${lowAttendanceMeetings.length} meetings had attendance below 70%`,
        actions: [
          'Review meeting timing and scheduling',
          'Send reminder notifications',
          'Check for recurring schedule conflicts'
        ]
      });
    }

    // Punctuality recommendations
    const lateParticipants = participants.filter(p => (p.lateCount || 0) > 2);
    if (lateParticipants.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Punctuality Improvement',
        description: `${lateParticipants.length} participants frequently arrive late`,
        actions: [
          'Send earlier reminder notifications',
          'Consider buffer time in scheduling',
          'Address individual attendance issues'
        ]
      });
    }

    // Engagement recommendations
    const averageAttendance = participants.reduce((sum, p) => sum + p.averageAttendance, 0) / Math.max(participants.length, 1);
    if (averageAttendance > 90) {
      recommendations.push({
        type: 'success',
        title: 'Excellent Engagement',
        description: 'Your team shows excellent meeting attendance',
        actions: [
          'Continue current meeting practices',
          'Consider team recognition',
          'Share best practices with other teams'
        ]
      });
    }

    return recommendations;
  };

  const calculateAttendanceTrend = (meetings) => {
    if (meetings.length < 2) return 0;
    const recent = meetings.slice(-5);
    const earlier = meetings.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.averageAttendance, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, m) => sum + m.averageAttendance, 0) / Math.max(earlier.length, 1);
    
    return recentAvg - earlierAvg;
  };

  const getPerformanceRating = (participant) => {
    const attendance = participant.averageAttendance;
    const consistency = Math.min(100, (participant.currentStreak * 10));
    const punctuality = Math.max(0, 100 - ((participant.lateCount || 0) * 10));
    
    const score = Math.round((attendance + consistency + punctuality) / 3);
    
    let rating = 'Poor';
    let color = 'error';
    
    if (score >= 90) { rating = 'Excellent'; color = 'success'; }
    else if (score >= 75) { rating = 'Good'; color = 'info'; }
    else if (score >= 60) { rating = 'Average'; color = 'warning'; }
    
    return { score, rating, color };
  };

  const getPerformanceTrend = (participant) => {
    const recent = participant.attendanceHistory?.slice(-3) || [];
    const earlier = participant.attendanceHistory?.slice(-6, -3) || [];
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, h) => sum + h.percentage, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, h) => sum + h.percentage, 0) / earlier.length;
    
    const diff = recentAvg - earlierAvg;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  };

  const getWeeklyAttendanceTrends = (meetings) => {
    // Implementation for weekly trends
    return meetings.reduce((acc, meeting) => {
      const week = getWeekOfYear(new Date(meeting.date));
      if (!acc[week]) acc[week] = { totalAttendance: 0, meetingCount: 0 };
      acc[week].totalAttendance += meeting.averageAttendance;
      acc[week].meetingCount += 1;
      return acc;
    }, {});
  };

  const getMonthlyAttendanceTrends = (meetings) => {
    // Implementation for monthly trends
    return meetings.reduce((acc, meeting) => {
      const month = new Date(meeting.date).toISOString().slice(0, 7);
      if (!acc[month]) acc[month] = { totalAttendance: 0, meetingCount: 0 };
      acc[month].totalAttendance += meeting.averageAttendance;
      acc[month].meetingCount += 1;
      return acc;
    }, {});
  };

  const getBusiestDays = (meetings) => {
    const dayCount = meetings.reduce((acc, meeting) => {
      const day = new Date(meeting.date).getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return Object.entries(dayCount)
      .map(([day, count]) => ({ day: days[day], count }))
      .sort((a, b) => b.count - a.count);
  };

  const getOptimalMeetingTimes = (meetings) => {
    // Analysis of best meeting times based on attendance
    const timeSlots = meetings.reduce((acc, meeting) => {
      const hour = new Date(meeting.date).getHours();
      if (!acc[hour]) acc[hour] = { totalAttendance: 0, meetingCount: 0 };
      acc[hour].totalAttendance += meeting.averageAttendance;
      acc[hour].meetingCount += 1;
      return acc;
    }, {});

    return Object.entries(timeSlots)
      .map(([hour, data]) => ({
        time: `${hour}:00`,
        averageAttendance: Math.round(data.totalAttendance / data.meetingCount),
        meetingCount: data.meetingCount
      }))
      .sort((a, b) => b.averageAttendance - a.averageAttendance);
  };

  const getSeasonalPatterns = (meetings) => {
    // Seasonal attendance patterns
    return meetings.reduce((acc, meeting) => {
      const month = new Date(meeting.date).getMonth();
      const season = getSeason(month);
      if (!acc[season]) acc[season] = { totalAttendance: 0, meetingCount: 0 };
      acc[season].totalAttendance += meeting.averageAttendance;
      acc[season].meetingCount += 1;
      return acc;
    }, {});
  };

  const getSeason = (month) => {
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

  const getWeekOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date - start) / 86400000 + start.getDay() + 1) / 7);
  };

  // Export functions
  const exportToPDF = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would use jsPDF or a similar library
      // For now, we'll create a comprehensive HTML report that can be printed as PDF
      const reportHTML = generatePDFReport();
      
      // Create a new window with the report
      const printWindow = window.open('', '_blank');
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    setLoading(true);
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Meetings', reportData.summary.totalMeetings],
        ['Total Participants', reportData.summary.totalParticipants],
        ['Average Attendance', `${reportData.summary.averageAttendance}%`],
        ['Top Performer', reportData.summary.topPerformer.name],
        ['Meetings This Week', reportData.summary.meetingsThisWeek]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Attendance data sheet
      const attendanceData = [
        ['Participant', 'Email', 'Attendance Rate', 'Total Meetings', 'Current Streak', 'Late Count'],
        ...reportData.performance.topPerformers.map(p => [
          p.name, p.email, `${p.attendanceRate}%`, p.totalMeetings, p.currentStreak, p.lateCount
        ])
      ];
      const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');
      
      // Meeting history sheet
      const meetingData = [
        ['Meeting Topic', 'Date', 'Attendance %', 'Participants'],
        ...reportData.attendance.attendanceByMeeting.map(m => [
          m.topic, new Date(m.date).toLocaleDateString(), `${m.attendance}%`, m.participants
        ])
      ];
      const meetingSheet = XLSX.utils.aoa_to_sheet(meetingData);
      XLSX.utils.book_append_sheet(workbook, meetingSheet, 'Meetings');
      
      // Generate and download the file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `attendance-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Excel export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    const currentDate = new Date().toLocaleDateString();
    const reportTitle = `Attendance Report - ${currentDate}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin-bottom: 30px; }
          .metric-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; min-width: 150px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
          .metric-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .recommendation { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0; }
          .chart-placeholder { height: 200px; background-color: #f8f9fa; display: flex; align-items: center; justify-content: center; margin: 20px 0; }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Generated on ${currentDate}</p>
        </div>
        
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="metric-card">
            <div class="metric-value">${reportData.summary.totalMeetings}</div>
            <div class="metric-label">Total Meetings</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${reportData.summary.totalParticipants}</div>
            <div class="metric-label">Participants</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${reportData.summary.averageAttendance}%</div>
            <div class="metric-label">Average Attendance</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${reportData.summary.topPerformer.name}</div>
            <div class="metric-label">Top Performer</div>
          </div>
        </div>
        
        <div class="section">
          <h2>Top Performers</h2>
          <table>
            <thead>
              <tr>
                <th>Participant</th>
                <th>Attendance Rate</th>
                <th>Total Meetings</th>
                <th>Current Streak</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.performance.topPerformers.slice(0, 10).map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.attendanceRate}%</td>
                  <td>${p.totalMeetings}</td>
                  <td>${p.currentStreak}</td>
                  <td>${p.performance.rating}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Recommendations</h2>
          ${reportData.recommendations.map(rec => `
            <div class="recommendation">
              <h3>${rec.title}</h3>
              <p>${rec.description}</p>
              <ul>
                ${rec.actions.map(action => `<li>${action}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2>Meeting History</h2>
          <table>
            <thead>
              <tr>
                <th>Meeting Topic</th>
                <th>Date</th>
                <th>Attendance</th>
                <th>Participants</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.attendance.attendanceByMeeting.slice(0, 20).map(m => `
                <tr>
                  <td>${m.topic}</td>
                  <td>${new Date(m.date).toLocaleDateString()}</td>
                  <td>${m.attendance}%</td>
                  <td>${m.participants}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  };

  const emailReport = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would send the report via email
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Report has been sent to the specified email address!');
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          📊 Advanced Reporting
        </Typography>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setReportDialog(true)}
          >
            Filters
          </Button>
          
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={exportToPDF}
            disabled={loading}
          >
            Export PDF
          </Button>
          
          <Button
            variant="contained"
            color="success"
            startIcon={<TableChart />}
            onClick={exportToExcel}
            disabled={loading}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h3">{reportData.summary.totalMeetings}</Typography>
              <Typography variant="body2">Total Meetings</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText', textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h3">{reportData.summary.averageAttendance}%</Typography>
              <Typography variant="body2">Average Attendance</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText', textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h3">{reportData.summary.totalParticipants}</Typography>
              <Typography variant="body2">Total Participants</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h3">
                {reportData.summary.attendanceTrend > 0 ? '+' : ''}{Math.round(reportData.summary.attendanceTrend)}%
              </Typography>
              <Typography variant="body2">Attendance Trend</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Summary" icon={<Analytics />} />
          <Tab label="Performance" icon={<TrendingUp />} />
          <Tab label="Attendance" icon={<People />} />
          <Tab label="Recommendations" icon={<Assessment />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      
      {/* Tab 1: Summary */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Performers</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Participant</TableCell>
                      <TableCell>Attendance Rate</TableCell>
                      <TableCell>Streak</TableCell>
                      <TableCell>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.performance.topPerformers.slice(0, 5).map((performer, index) => (
                      <TableRow key={performer.email}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {index < 3 && <Star color="warning" />}
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
                            {performer.attendanceRate}%
                            <LinearProgress
                              variant="determinate"
                              value={performer.attendanceRate}
                              sx={{ width: 50, height: 6 }}
                              color={performer.attendanceRate >= 90 ? 'success' : performer.attendanceRate >= 75 ? 'warning' : 'error'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{performer.currentStreak} meetings</TableCell>
                        <TableCell>
                          <Chip
                            label={performer.performance.rating}
                            color={performer.performance.color}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Attendance Distribution</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText 
                      primary={`Excellent (95%+): ${reportData.attendance.attendanceDistribution.excellent} people`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="info" /></ListItemIcon>
                    <ListItemText 
                      primary={`Good (80-94%): ${reportData.attendance.attendanceDistribution.good} people`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="warning" /></ListItemIcon>
                    <ListItemText 
                      primary={`Average (60-79%): ${reportData.attendance.attendanceDistribution.average} people`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText 
                      primary={`Poor (&lt;60%): ${reportData.attendance.attendanceDistribution.poor} people`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Performance */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Individual Performance Analysis</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Participant</TableCell>
                      <TableCell>Attendance Rate</TableCell>
                      <TableCell>Total Meetings</TableCell>
                      <TableCell>Current Streak</TableCell>
                      <TableCell>Late Count</TableCell>
                      <TableCell>Performance Rating</TableCell>
                      <TableCell>Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.performance.topPerformers.map((performer) => (
                      <TableRow key={performer.email}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {performer.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {performer.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {performer.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{performer.attendanceRate}%</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={performer.attendanceRate}
                              sx={{ mt: 0.5, height: 4 }}
                              color={performer.attendanceRate >= 90 ? 'success' : performer.attendanceRate >= 75 ? 'warning' : 'error'}
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
                        <TableCell>{performer.lateCount}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Rating value={performer.performance.score / 20} readOnly size="small" />
                            <Chip
                              label={performer.performance.rating}
                              color={performer.performance.color}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={performer.trend}
                            color={performer.trend === 'improving' ? 'success' : performer.trend === 'declining' ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: Attendance */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Meeting-by-Meeting Attendance</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Meeting Topic</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Attendance Rate</TableCell>
                  <TableCell>Total Participants</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.attendance.attendanceByMeeting.map((meeting, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {meeting.topic}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(meeting.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {meeting.attendance}%
                        <LinearProgress
                          variant="determinate"
                          value={meeting.attendance}
                          sx={{ width: 80, height: 6 }}
                          color={meeting.attendance >= 80 ? 'success' : meeting.attendance >= 60 ? 'warning' : 'error'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{meeting.participants}</TableCell>
                    <TableCell>
                      <Chip
                        label={meeting.attendance >= 80 ? 'Excellent' : meeting.attendance >= 60 ? 'Good' : 'Needs Improvement'}
                        color={meeting.attendance >= 80 ? 'success' : meeting.attendance >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Recommendations */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          {reportData.recommendations.map((recommendation, index) => (
            <Grid item xs={12} key={index}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {recommendation.type === 'success' && <CheckCircle color="success" />}
                    {recommendation.type === 'warning' && <Warning color="warning" />}
                    {recommendation.type === 'info' && <Analytics color="info" />}
                    <Typography variant="h6">{recommendation.title}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph>
                    {recommendation.description}
                  </Typography>
                  <Typography variant="h6" gutterBottom>Recommended Actions:</Typography>
                  <List>
                    {recommendation.actions.map((action, actionIndex) => (
                      <ListItem key={actionIndex}>
                        <ListItemText primary={`• ${action}`} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
          
          {reportData.recommendations.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                No specific recommendations at this time. Your attendance metrics look good!
              </Alert>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Filter Dialog */}
      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={reportFilters.dateRange}
                  label="Date Range"
                  onChange={(e) => setReportFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  <MenuItem value="last7days">Last 7 Days</MenuItem>
                  <MenuItem value="last30days">Last 30 Days</MenuItem>
                  <MenuItem value="last90days">Last 90 Days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {reportFilters.dateRange === 'custom' && (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={reportFilters.startDate}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={reportFilters.endDate}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setReportDialog(false)}>Apply Filters</Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {loading && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            bgcolor: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Box textAlign="center" color="white">
            <CircularProgress color="inherit" />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Generating Report...
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedReporting;
