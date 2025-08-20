import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  ExpandMore,
  BugReport,
  Memory,
  Speed,
  Accessibility
} from '@mui/icons-material';
import { safeConsoleMonitor } from '../utils/safeConsoleMonitor';

const ErrorDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  useEffect(() => {
    updateSummary();
    const interval = setInterval(updateSummary, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const updateSummary = () => {
    setSummary(safeConsoleMonitor.getErrorSummary());
  };

  const handleViewDetails = (error) => {
    setSelectedError(error);
    setDetailsOpen(true);
  };

  const handleExportReport = () => {
    safeConsoleMonitor.exportErrorReport();
  };

  const handleClearErrors = () => {
    safeConsoleMonitor.clearErrors();
    updateSummary();
  };

  const getErrorSeverityColor = (type) => {
    switch (type) {
      case 'CONSOLE_ERROR':
      case 'WINDOW_ERROR':
      case 'UNHANDLED_REJECTION':
        return 'error';
      case 'CONSOLE_WARN':
      case 'PERFORMANCE_ISSUE':
      case 'POTENTIAL_MEMORY_LEAK':
        return 'warning';
      case 'ACCESSIBILITY_ISSUE':
        return 'info';
      default:
        return 'default';
    }
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'CONSOLE_ERROR':
      case 'WINDOW_ERROR':
      case 'UNHANDLED_REJECTION':
        return <ErrorIcon />;
      case 'CONSOLE_WARN':
      case 'PERFORMANCE_ISSUE':
      case 'POTENTIAL_MEMORY_LEAK':
        return <WarningIcon />;
      case 'ACCESSIBILITY_ISSUE':
        return <Accessibility />;
      default:
        return <BugReport />;
    }
  };

  if (!summary) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading error dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          🐛 Console Error Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh data">
            <IconButton onClick={updateSummary}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportReport}
          >
            Export Report
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClearErrors}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ErrorIcon color="error" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="error">
                    {summary.totalErrors}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Errors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <WarningIcon color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {summary.totalWarnings}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Warnings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircleIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {summary.fixesApplied}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Fixes Applied
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Speed color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {(summary.totalErrors + summary.totalWarnings) === 0 ? '100%' : 
                     Math.round((summary.fixesApplied / (summary.totalErrors + summary.totalWarnings + summary.fixesApplied)) * 100) + '%'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Health Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Applied Fixes */}
      {summary.appliedFixes.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ✅ Applied Fixes ({summary.appliedFixes.length})
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {summary.appliedFixes.map((fix, index) => (
                <Chip 
                  key={index} 
                  label={fix.replace(/_/g, ' ')} 
                  color="success" 
                  variant="outlined" 
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recent Errors */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                🔴 Recent Errors ({summary.recentErrors.length})
              </Typography>
              {summary.recentErrors.length === 0 ? (
                <Alert severity="success">No recent errors! 🎉</Alert>
              ) : (
                <List>
                  {summary.recentErrors.map((error, index) => (
                    <ListItem 
                      key={index}
                      button
                      onClick={() => handleViewDetails(error)}
                    >
                      <Box display="flex" alignItems="center" width="100%">
                        {getErrorIcon(error.type)}
                        <ListItemText
                          sx={{ ml: 2 }}
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={error.type} 
                                color={getErrorSeverityColor(error.type)} 
                                size="small"
                              />
                              <Typography variant="body2">
                                {new Date(error.timestamp).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" noWrap>
                              {error.message}
                            </Typography>
                          }
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">
                ⚠️ Recent Warnings ({summary.recentWarnings.length})
              </Typography>
              {summary.recentWarnings.length === 0 ? (
                <Alert severity="success">No recent warnings! 🎉</Alert>
              ) : (
                <List>
                  {summary.recentWarnings.map((warning, index) => (
                    <ListItem 
                      key={index}
                      button
                      onClick={() => handleViewDetails(warning)}
                    >
                      <Box display="flex" alignItems="center" width="100%">
                        {getErrorIcon(warning.type)}
                        <ListItemText
                          sx={{ ml: 2 }}
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={warning.type} 
                                color={getErrorSeverityColor(warning.type)} 
                                size="small"
                              />
                              <Typography variant="body2">
                                {new Date(warning.timestamp).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" noWrap>
                              {warning.message}
                            </Typography>
                          }
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {selectedError && getErrorIcon(selectedError.type)}
            Error/Warning Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedError && (
            <Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell variant="head">Type</TableCell>
                      <TableCell>
                        <Chip 
                          label={selectedError.type} 
                          color={getErrorSeverityColor(selectedError.type)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell variant="head">Timestamp</TableCell>
                      <TableCell>{new Date(selectedError.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell variant="head">Message</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {selectedError.message}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {selectedError.stack && (
                      <TableRow>
                        <TableCell variant="head">Stack Trace</TableCell>
                        <TableCell>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="body2">View Stack Trace</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box 
                                component="pre" 
                                sx={{ 
                                  fontSize: '0.75rem', 
                                  overflow: 'auto', 
                                  backgroundColor: 'grey.100',
                                  p: 1,
                                  borderRadius: 1,
                                  maxHeight: 300
                                }}
                              >
                                {selectedError.stack}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ErrorDashboard;
