import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  TablePagination,
  InputAdornment,
  Alert,
  CircularProgress,
  Fade,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Swal from 'sweetalert2';

const EnhancedStudentManagement = () => {
  const theme = useTheme();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  
  // Dialog states
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [openEditStudent, setOpenEditStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    studentId: '',
    className: '',
    year: '',
    status: 'active',
    dateOfBirth: '',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: ''
  });

  // Mock data for students
  const mockStudents = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@student.edu',
      phone: '+1234567890',
      studentId: 'STU001',
      className: 'Computer Science',
      year: '2024',
      status: 'active',
      dateOfBirth: '2000-05-15',
      address: '123 Main St, City, State',
      parentName: 'Jane Doe',
      parentPhone: '+1234567891',
      parentEmail: 'jane.doe@email.com',
      enrollmentDate: '2021-09-01',
      gpa: 3.8,
      attendance: 92
    },
    {
      id: 2,
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@student.edu',
      phone: '+1234567892',
      studentId: 'STU002',
      className: 'Mathematics',
      year: '2023',
      status: 'active',
      dateOfBirth: '2001-03-22',
      address: '456 Oak Ave, City, State',
      parentName: 'Bob Smith',
      parentPhone: '+1234567893',
      parentEmail: 'bob.smith@email.com',
      enrollmentDate: '2021-09-01',
      gpa: 3.9,
      attendance: 95
    },
    {
      id: 3,
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@student.edu',
      phone: '+1234567894',
      studentId: 'STU003',
      className: 'Physics',
      year: '2022',
      status: 'inactive',
      dateOfBirth: '1999-11-08',
      address: '789 Pine St, City, State',
      parentName: 'Sarah Johnson',
      parentPhone: '+1234567895',
      parentEmail: 'sarah.johnson@email.com',
      enrollmentDate: '2021-09-01',
      gpa: 3.5,
      attendance: 78
    },
    {
      id: 4,
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@student.edu',
      phone: '+1234567896',
      studentId: 'STU004',
      className: 'Chemistry',
      year: '2024',
      status: 'active',
      dateOfBirth: '2000-07-19',
      address: '321 Elm St, City, State',
      parentName: 'David Wilson',
      parentPhone: '+1234567897',
      parentEmail: 'david.wilson@email.com',
      enrollmentDate: '2021-09-01',
      gpa: 4.0,
      attendance: 98
    },
    {
      id: 5,
      firstName: 'James',
      lastName: 'Brown',
      email: 'james.brown@student.edu',
      phone: '+1234567898',
      studentId: 'STU005',
      className: 'Engineering',
      year: '2023',
      status: 'active',
      dateOfBirth: '2001-01-12',
      address: '654 Maple Ave, City, State',
      parentName: 'Lisa Brown',
      parentPhone: '+1234567899',
      parentEmail: 'lisa.brown@email.com',
      enrollmentDate: '2021-09-01',
      gpa: 3.7,
      attendance: 88
    }
  ];

  const classes = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Engineering', 'Biology', 'English', 'History'];
  const years = ['2021', '2022', '2023', '2024', '2025'];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setStudents(mockStudents);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch students');
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, student) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStudent(null);
  };

  const handleAddStudent = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      studentId: '',
      className: '',
      year: '',
      status: 'active',
      dateOfBirth: '',
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: ''
    });
    setOpenAddStudent(true);
  };

  const handleEditStudent = (student) => {
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      studentId: student.studentId,
      className: student.className,
      year: student.year,
      status: student.status,
      dateOfBirth: student.dateOfBirth,
      address: student.address,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail
    });
    setSelectedStudent(student);
    setOpenEditStudent(true);
    handleMenuClose();
  };

  const handleDeleteStudent = async (student) => {
    handleMenuClose();
    const result = await Swal.fire({
      title: 'Delete Student',
      text: `Are you sure you want to delete ${student.firstName} ${student.lastName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#grey',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setStudents(students.filter(s => s.id !== student.id));
        Swal.fire('Deleted!', 'Student has been deleted.', 'success');
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete student.', 'error');
      }
    }
  };

  const handleFormSubmit = async (isEdit = false) => {
    try {
      if (isEdit) {
        // Update student
        const updatedStudents = students.map(s => 
          s.id === selectedStudent.id 
            ? { 
                ...s, 
                ...formData,
                enrollmentDate: s.enrollmentDate,
                gpa: s.gpa,
                attendance: s.attendance
              }
            : s
        );
        setStudents(updatedStudents);
        setOpenEditStudent(false);
        Swal.fire('Updated!', 'Student has been updated.', 'success');
      } else {
        // Add new student
        const newStudent = {
          id: Date.now(),
          ...formData,
          enrollmentDate: new Date().toISOString().split('T')[0],
          gpa: 0,
          attendance: 0
        };
        setStudents([...students, newStudent]);
        setOpenAddStudent(false);
        Swal.fire('Added!', 'New student has been added.', 'success');
      }
    } catch (err) {
      Swal.fire('Error!', 'Failed to save student.', 'error');
    }
  };

  const handleExportStudents = () => {
    // Simulate export functionality
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Student ID', 'Class', 'Year', 'Status', 'GPA', 'Attendance'].join(','),
      ...students.map(s => [
        s.firstName, s.lastName, s.email, s.studentId, s.className, s.year, s.status, s.gpa, s.attendance
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students.csv';
    link.click();
    window.URL.revokeObjectURL(url);

    Swal.fire('Success!', 'Student data exported successfully.', 'success');
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.className.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    const matchesClass = filterClass === 'all' || student.className === filterClass;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const paginatedStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getGpaColor = (gpa) => {
    if (gpa >= 3.5) return 'success';
    if (gpa >= 3.0) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={600}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Student Management
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportStudents}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddStudent}
              sx={{ 
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                }
              }}
            >
              Add Student
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {students.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {students.filter(s => s.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {Math.round(students.reduce((sum, s) => sum + s.gpa, 0) / students.length * 100) / 100}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average GPA
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / students.length)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Attendance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={filterClass}
                    label="Class"
                    onChange={(e) => setFilterClass(e.target.value)}
                  >
                    <MenuItem value="all">All Classes</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography variant="body2" color="text.secondary">
                  Total: {filteredStudents.length} students
                </Typography>
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
                  <TableCell>Class</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>GPA</TableCell>
                  <TableCell>Attendance</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {student.firstName} {student.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {student.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {student.studentId}
                      </Typography>
                    </TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell>{student.year}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        color={getStatusColor(student.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.gpa}
                        color={getGpaColor(student.gpa)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{student.attendance}%</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, student)}
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
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredStudents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleEditStudent(selectedStudent)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Student</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleDeleteStudent(selectedStudent)} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Student</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add/Edit Student Dialog */}
        <Dialog 
          open={openAddStudent || openEditStudent} 
          onClose={() => {
            setOpenAddStudent(false);
            setOpenEditStudent(false);
          }} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            {openAddStudent ? 'Add New Student' : 'Edit Student'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student ID"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={formData.className}
                    label="Class"
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  >
                    {classes.map((cls) => (
                      <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={formData.year}
                    label="Year"
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Parent Name"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Parent Phone"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Parent Email"
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenAddStudent(false);
              setOpenEditStudent(false);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleFormSubmit(openEditStudent)} 
              variant="contained"
              disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.studentId}
            >
              {openAddStudent ? 'Add Student' : 'Update Student'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default EnhancedStudentManagement;
