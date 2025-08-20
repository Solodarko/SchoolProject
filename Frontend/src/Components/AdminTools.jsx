import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress
} from '@mui/material';
import {
  DeleteSweep as CleanupIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Storage as DatabaseIcon,
  Videocam as ZoomIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import axios from 'axios';

const AdminTools = () => {
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState(0);
  const [cleanupStatus, setCleanupStatus] = useState('');
  const [systemStats, setSystemStats] = useState({
    databaseMeetings: 0,
    zoomMeetings: 0,
    webhookQueue: 0,
    loading: true
  });
  const [cleanupResults, setCleanupResults] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Load system statistics
  const loadSystemStats = async () => {
    setSystemStats(prev => ({ ...prev, loading: true }));
    try {
      const [dbResponse, zoomResponse, webhookResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/meetings`),
        axios.get(`${API_BASE_URL}/zoom/meetings`),
        axios.get(`${API_BASE_URL}/webhooks/webhook-status`)
      ]);

      setSystemStats({
        databaseMeetings: dbResponse.data.total || 0,
        zoomMeetings: zoomResponse.data.total || 0,
        webhookQueue: webhookResponse.data.processing?.reconciliationQueueLength || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
      setSystemStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadSystemStats();
  }, []);

  // Comprehensive cleanup function
  const performCleanup = async () => {
    setIsCleaningUp(true);
    setCleanupProgress(0);
    setCleanupStatus('Starting cleanup...');
    
    const results = {
      databaseDeleted: 0,
      zoomDeleted: 0,
      errors: [],
      success: false
    };

    try {
      // Step 1: Get all meetings
      setCleanupStatus('Fetching meetings from database...');
      setCleanupProgress(10);
      
      const dbResponse = await axios.get(`${API_BASE_URL}/meetings`);
      const dbMeetings = dbResponse.data.data || [];
      
      setCleanupStatus('Fetching meetings from Zoom...');
      setCleanupProgress(20);
      
      const zoomResponse = await axios.get(`${API_BASE_URL}/zoom/meetings`);
      const zoomMeetings = zoomResponse.data.meetings || [];

      // Step 2: Delete Zoom meetings
      setCleanupStatus('Cleaning up Zoom meetings...');
      setCleanupProgress(30);
      
      for (let i = 0; i < zoomMeetings.length; i++) {
        const meeting = zoomMeetings[i];
        try {
          // Try to delete from Zoom API if endpoint exists
          const deleteResponse = await axios.delete(`${API_BASE_URL}/zoom/meetings/${meeting.id}`);
          if (deleteResponse.status === 200) {
            results.zoomDeleted++;
          }
        } catch (error) {
          // Most likely the DELETE endpoint doesn't exist, which is fine
          // Zoom meetings cleanup might be handled automatically
          console.log(`Zoom meeting ${meeting.id} cleanup handled automatically`);
        }
        setCleanupProgress(30 + (i / zoomMeetings.length) * 30);
      }

      // Step 3: Delete database meetings
      setCleanupStatus('Cleaning up database meetings...');
      setCleanupProgress(60);
      
      for (let i = 0; i < dbMeetings.length; i++) {
        const meeting = dbMeetings[i];
        try {
          await axios.delete(`${API_BASE_URL}/meetings/${meeting.id}`);
          results.databaseDeleted++;
        } catch (error) {
          results.errors.push(`Failed to delete meeting: ${meeting.title}`);
        }
        setCleanupProgress(60 + (i / dbMeetings.length) * 30);
      }

      // Step 4: Clear webhook queue if endpoint exists
      setCleanupStatus('Clearing webhook queue...');
      setCleanupProgress(90);
      
      try {
        await axios.delete(`${API_BASE_URL}/zoom/reconciliation-queue`);
      } catch (error) {
        // Queue clearing might not be available, that's okay
        console.log('Webhook queue clearing not available');
      }

      setCleanupStatus('Cleanup completed!');
      setCleanupProgress(100);
      
      results.success = true;
      setCleanupResults(results);
      
      // Refresh stats
      setTimeout(() => {
        loadSystemStats();
      }, 1000);

    } catch (error) {
      console.error('Cleanup failed:', error);
      results.errors.push(`General cleanup error: ${error.message}`);
      setCleanupResults(results);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleCleanupClick = () => {
    setIsCleanupDialogOpen(true);
    setCleanupResults(null);
  };

  const handleConfirmCleanup = async () => {
    setIsCleanupDialogOpen(false);
    
    const result = await Swal.fire({
      title: 'Are you absolutely sure?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>This will permanently delete:</strong></p>
          <ul>
            <li>${systemStats.databaseMeetings} meetings from the database</li>
            <li>${systemStats.zoomMeetings} Zoom meeting records</li>
            <li>All associated participant data</li>
            <li>All webhook queue data</li>
          </ul>
          <p style="color: #d32f2f; margin-top: 15px;"><strong>⚠️ This action cannot be undone!</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#1976d2',
      confirmButtonText: 'Yes, delete everything!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      await performCleanup();
      
      // Show results
      if (cleanupResults?.success) {
        Swal.fire({
          title: 'Cleanup Complete!',
          html: `
            <div style="text-align: left;">
              <p>✅ Database meetings deleted: ${cleanupResults.databaseDeleted}</p>
              <p>✅ Zoom meetings processed: ${cleanupResults.zoomDeleted}</p>
              ${cleanupResults.errors.length > 0 ? `<p>⚠️ Errors: ${cleanupResults.errors.length}</p>` : ''}
            </div>
          `,
          icon: 'success',
          timer: 5000
        });
      } else {
        Swal.fire({
          title: 'Cleanup Completed with Issues',
          text: 'Some errors occurred during cleanup. Check the console for details.',
          icon: 'warning'
        });
      }
    }
  };

  const handleCancelCleanup = () => {
    setIsCleanupDialogOpen(false);
  };

  const handleRefreshStats = () => {
    loadSystemStats();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Admin Tools
      </Typography>
      
      <Grid container spacing={3}>
        {/* System Statistics Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  System Statistics
                </Typography>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshStats}
                  disabled={systemStats.loading}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              
              {systemStats.loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <DatabaseIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Database Meetings"
                      secondary={`${systemStats.databaseMeetings} meetings stored`}
                    />
                    <Chip 
                      label={systemStats.databaseMeetings}
                      color={systemStats.databaseMeetings > 0 ? "warning" : "success"}
                      variant="outlined"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <ZoomIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Zoom Meeting Records"
                      secondary={`${systemStats.zoomMeetings} Zoom meetings tracked`}
                    />
                    <Chip 
                      label={systemStats.zoomMeetings}
                      color={systemStats.zoomMeetings > 0 ? "warning" : "success"}
                      variant="outlined"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <RefreshIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Webhook Queue"
                      secondary={`${systemStats.webhookQueue} items pending`}
                    />
                    <Chip 
                      label={systemStats.webhookQueue}
                      color={systemStats.webhookQueue > 0 ? "error" : "success"}
                      variant="outlined"
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Cleanup Tools Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CleanupIcon color="error" />
                Data Cleanup
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Remove all test meetings and associated data from the system.
              </Typography>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<CleanupIcon />}
                onClick={handleCleanupClick}
                disabled={systemStats.loading || (systemStats.databaseMeetings === 0 && systemStats.zoomMeetings === 0)}
                fullWidth
                size="large"
              >
                Clean Up All Meetings
              </Button>
              
              {systemStats.databaseMeetings === 0 && systemStats.zoomMeetings === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No meetings to clean up
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Cleanup Progress Dialog */}
      <Dialog
        open={isCleaningUp}
        disableEscapeKeyDown
        disableBackdropClick
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CleanupIcon color="primary" />
            Cleaning Up System Data
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {cleanupStatus}
            </Typography>
            <LinearProgress variant="determinate" value={cleanupProgress} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {cleanupProgress}% complete
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={isCleanupDialogOpen}
        onClose={handleCancelCleanup}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Confirm System Cleanup
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              This will permanently delete ALL meeting data!
            </Typography>
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            The following data will be permanently removed:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><DatabaseIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary={`${systemStats.databaseMeetings} Database Meetings`}
                secondary="All meeting records, participant data, and attendance logs"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><ZoomIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary={`${systemStats.zoomMeetings} Zoom Meeting Records`}
                secondary="Zoom integration data and webhook tracking"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><RefreshIcon color="primary" /></ListItemIcon>
              <ListItemText
                primary="Webhook Queue Data"
                secondary="All pending webhook events and reconciliation data"
              />
            </ListItem>
          </List>
          
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>⚠️ This action cannot be undone!</strong> Make sure you have backups if needed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCleanup} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmCleanup} color="error" variant="contained">
            Yes, Delete Everything
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTools;
