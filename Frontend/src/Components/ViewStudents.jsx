import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  TablePagination,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

const ViewStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [classes, setClasses] = useState(['All', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5']);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the API service to fetch students
      const response = await apiService.students.getAll();
      setStudents(response.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
      // Fallback to sample data for demo
      setStudents(generateSampleStudents());
    } finally {
      setLoading(false);
    }
  };

  // Generate sample students for demo purposes
  const generateSampleStudents = () => {
    return [
      {
        id: 1,
        StudentID: 'ST001',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john.doe@email.com',
        PhoneNumber: '+1234567890',
        Class: 'Grade 3',
        DateOfBirth: '2010-05-15',
        Address: '123 Main St, City',
        ParentName: 'Jane Doe',
        ParentContact: '+1234567891',
        EnrollmentDate: '2023-09-01'
      },
      {
        id: 2,
        StudentID: 'ST002',
        FirstName: 'Alice',
        LastName: 'Smith',
        Email: 'alice.smith@email.com',
        PhoneNumber: '+1234567892',
        Class: 'Grade 4',
        DateOfBirth: '2009-08-22',
        Address: '456 Oak Ave, City',
        ParentName: 'Bob Smith',
        ParentContact: '+1234567893',
        EnrollmentDate: '2023-09-01'
      },
      {
        id: 3,
        StudentID: 'ST003',
        FirstName: 'Michael',
        LastName: 'Johnson',
        Email: 'michael.j@email.com',
        PhoneNumber: '+1234567894',
        Class: 'Grade 3',
        DateOfBirth: '2010-03-10',
        Address: '789 Pine St, City',
        ParentName: 'Sarah Johnson',
        ParentContact: '+1234567895',
        EnrollmentDate: '2023-09-01'
      },
      {
        id: 4,
        StudentID: 'ST004',
        FirstName: 'Emma',
        LastName: 'Brown',
        Email: 'emma.brown@email.com',
        PhoneNumber: '+1234567896',
        Class: 'Grade 2',
        DateOfBirth: '2011-11-05',
        Address: '321 Elm St, City',
        ParentName: 'David Brown',
        ParentContact: '+1234567897',
        EnrollmentDate: '2023-09-01'
      },
      {
        id: 5,
        StudentID: 'ST005',
        FirstName: 'William',
        LastName: 'Davis',
        Email: 'william.davis@email.com',
        PhoneNumber: '+1234567898',
        Class: 'Grade 5',
        DateOfBirth: '2008-07-18',
        Address: '654 Maple Ave, City',
        ParentName: 'Lisa Davis',
        ParentContact: '+1234567899',
        EnrollmentDate: '2023-09-01'
      }
    ];
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      `${student.FirstName} ${student.LastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.StudentID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.Email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = filterClass === '' || filterClass === 'All' || student.Class === filterClass;
    
    return matchesSearch && matchesClass;
  });

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, student) => {
    setMenuAnchor(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedStudent(null);
  };

  const handleViewStudent = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleEditStudent = () => {
    // Navigate to edit student page or open edit dialog
    console.log('Edit student:', selectedStudent);
    handleMenuClose();
  };

  const handleDeleteStudent = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    try {
      await apiService.students.delete(selectedStudent.id);
      setStudents(students.filter(s => s.id !== selectedStudent.id));
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student. Please try again.');
    }
  };

  const exportStudents = () => {
    const csvContent = [
      ['Student ID', 'Name', 'Email', 'Phone', 'Class', 'Enrollment Date'].join(','),
      ...filteredStudents.map(student => [
        student.StudentID,
        `${student.FirstName} ${student.LastName}`,
        student.Email,
        student.PhoneNumber,
        student.Class,
        student.EnrollmentDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          View Students
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and manage all registered students
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search students..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Filter by Class"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls} value={cls}>
                    {cls}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchStudents}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={exportStudents}
                >
                  Export CSV
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  href="/admin-dashboard/add-students"
                >
                  Add Student
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Enrollment Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {student.FirstName[0]}{student.LastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {student.FirstName} {student.LastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.ParentName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={student.StudentID} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{student.Email}</TableCell>
                    <TableCell>{student.PhoneNumber}</TableCell>
                    <TableCell>
                      <Chip label={student.Class} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      {new Date(student.EnrollmentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, student)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredStudents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewStudent}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditStudent}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Student</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteStudent} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Student</ListItemText>
        </MenuItem>
      </Menu>

      {/* View Student Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Student Details</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                    {selectedStudent.FirstName[0]}{selectedStudent.LastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedStudent.FirstName} {selectedStudent.LastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {selectedStudent.StudentID}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box textAlign="right">
                  <Chip label={selectedStudent.Class} color="primary" />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  <EmailIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Email
                </Typography>
                <Typography>{selectedStudent.Email}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  <PhoneIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Phone
                </Typography>
                <Typography>{selectedStudent.PhoneNumber}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Date of Birth
                </Typography>
                <Typography>{new Date(selectedStudent.DateOfBirth).toLocaleDateString()}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Enrollment Date
                </Typography>
                <Typography>{new Date(selectedStudent.EnrollmentDate).toLocaleDateString()}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Address
                </Typography>
                <Typography>{selectedStudent.Address}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Parent/Guardian
                </Typography>
                <Typography>{selectedStudent.ParentName}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Parent Contact
                </Typography>
                <Typography>{selectedStudent.ParentContact}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleEditStudent}>
            Edit Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete student "{selectedStudent?.FirstName} {selectedStudent?.LastName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewStudents;

