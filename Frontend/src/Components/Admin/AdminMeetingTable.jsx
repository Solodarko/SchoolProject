import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  TextField,
  Grid,
  Alert,
  Badge
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarColumnsButton
} from '@mui/x-data-grid';
import {
  Person,
  Schedule,
  Groups,
  School,
  Email,
  Refresh,
  FileDownload,
  Visibility,
  ContentCopy
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { safeFormatJoinTime, safeFormatShortDate } from '../../utils/safeDateFormat';

const AdminMeetingTable = ({ 
  participantsData = [], 
  loading = false, 
  onRefresh = null,
  title = "Meeting Participants",
  showToolbar = true,
  height = 600
}) => {
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  // Filter data based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredData(participantsData);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = participantsData.filter(row =>
        row.userName?.toLowerCase().includes(searchLower) ||
        row.userEmail?.toLowerCase().includes(searchLower) ||
        row.meetingTopic?.toLowerCase().includes(searchLower) ||
        row.meetingId?.toString().includes(searchLower) ||
        row.studentId?.toLowerCase().includes(searchLower) ||
        row.trackingId?.toLowerCase().includes(searchLower)
      );
      setFilteredData(filtered);
    }
  }, [participantsData, searchText]);

  // Copy to clipboard function
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log(`${label} copied to clipboard: ${text}`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Custom toolbar component
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      {onRefresh && (
        <Button
          startIcon={<Refresh />}
          onClick={onRefresh}
          disabled={loading}
          size="small"
          sx={{ ml: 1 }}
        >
          Refresh
        </Button>
      )}
    </GridToolbarContainer>
  );

  // Define columns for the DataGrid
  const columns = useMemo(() => [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      type: 'dateTime',
      valueGetter: (params) => new Date(params.value),
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {safeFormatJoinTime(params.value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {safeFormatShortDate(params.value)}
          </Typography>
        </Box>
      ),
      sortable: true
    },
    {
      field: 'userName',
      headerName: 'User',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <Person fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.userEmail}
            </Typography>
          </Box>
        </Box>
      ),
      sortable: true
    },
    {
      field: 'studentId',
      headerName: 'Student ID',
      width: 150,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color="info"
          variant="outlined"
          icon={<School />}
        />
      ),
      sortable: true
    },
    {
      field: 'meetingTopic',
      headerName: 'Meeting',
      width: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold" noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {params.row.meetingId}
          </Typography>
        </Box>
      ),
      sortable: true
    },
    {
      field: 'participantCount',
      headerName: 'Participant #',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Chip
          label={`#${params.value}`}
          color="success"
          size="small"
          icon={<Groups />}
        />
      ),
      sortable: true
    },
    {
      field: 'trackingId',
      headerName: 'Tracking ID',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography 
            variant="caption" 
            fontFamily="monospace"
            sx={{ 
              bgcolor: 'grey.100', 
              p: 0.5, 
              borderRadius: 0.5,
              fontSize: '0.7rem',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.value?.substring(0, 20)}...
          </Typography>
          <Tooltip title="Copy Tracking ID">
            <IconButton
              size="small"
              onClick={() => copyToClipboard(params.value, 'Tracking ID')}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      sortable: false
    },
    {
      field: 'userEmail',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Email fontSize="small" color="action" />
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Box>
      ),
      sortable: true
    },
    {
      field: 'message',
      headerName: 'Message',
      width: 300,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          color="success.main"
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {params.value}
        </Typography>
      ),
      sortable: false
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => {
                console.log('View details for:', params.row);
                // You could implement a detail view modal here
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      sortable: false,
      filterable: false
    }
  ], []);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalJoins = participantsData.length;
    const uniqueUsers = new Set(participantsData.map(item => item.userId)).size;
    const uniqueMeetings = new Set(participantsData.map(item => item.meetingId)).size;
    const recentJoins = participantsData.filter(item => 
      new Date(item.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalJoins,
      uniqueUsers,
      uniqueMeetings,
      recentJoins
    };
  }, [participantsData]);

  // Render statistics cards
  const renderStatsCards = () => {
    const cards = [
      {
        title: 'Total Joins',
        value: statistics.totalJoins,
        icon: <Groups />,
        color: 'primary'
      },
      {
        title: 'Unique Users',
        value: statistics.uniqueUsers,
        icon: <Person />,
        color: 'success'
      },
      {
        title: 'Meetings',
        value: statistics.uniqueMeetings,
        icon: <School />,
        color: 'info'
      },
      {
        title: 'Recent (24h)',
        value: statistics.recentJoins,
        icon: <Schedule />,
        color: 'warning'
      }
    ];

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={1}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: `${card.color}.main`,
                      color: 'white',
                      mr: 2
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" color={`${card.color}.main`}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Groups color="primary" />
          {title}
          <Badge badgeContent={filteredData.length} color="primary" sx={{ ml: 1 }} />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time tracking of meeting participants and join events
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {participantsData.length > 0 && renderStatsCards()}

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by user name, email, meeting topic, meeting ID, student ID, or tracking ID..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {/* Data Grid */}
      <Card elevation={2}>
        <CardContent sx={{ p: 0 }}>
          {participantsData.length === 0 && !loading ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
              <Groups sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Participant Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No meeting participant data found. Data will appear here when users join meetings.
              </Typography>
              {onRefresh && (
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={onRefresh}
                  size="small"
                >
                  Refresh Data
                </Button>
              )}
            </Box>
          ) : (
            <DataGrid
              rows={filteredData}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.trackingId || `${row.meetingId}-${row.userId}-${row.timestamp}`}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 }
                },
                sorting: {
                  sortModel: [{ field: 'timestamp', sort: 'desc' }]
                }
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
              autoHeight={false}
              sx={{ 
                height: height,
                '& .MuiDataGrid-cell': {
                  borderBottom: 1,
                  borderColor: 'divider'
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: 'action.hover'
                }
              }}
              slots={{
                toolbar: showToolbar ? CustomToolbar : null
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 }
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      {participantsData.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Data Info:</strong> Showing {filteredData.length} of {participantsData.length} total participant join events. 
          Data is updated in real-time as users join meetings.
        </Alert>
      )}
    </Box>
  );
};

export default AdminMeetingTable;
