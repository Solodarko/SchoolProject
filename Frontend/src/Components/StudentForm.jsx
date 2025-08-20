import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Container,
  Paper,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNotification } from '../context/NotificationContext';
import { useNotificationSystem } from '../context/NotificationSystem';

const StudentForm = ({ fetchStudents }) => {
  const theme = useTheme();
  const { success, error, warning } = useNotification();
  const { addStudentNotification } = useNotificationSystem();
  const [studentData, setStudentData] = useState({
    StudentID: '',
    FirstName: '',
    LastName: '',
    Email: '',
    PhoneNumber: '',
    DateOfBirth: '',
    Gender: '',
    Department: '',
    TimeIn: '',
    TimeOut: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5000/stu/check-email/${email}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false; 
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validation for empty fields
    if (!studentData.StudentID || !studentData.FirstName || !studentData.LastName) {
      error('Please fill in all required fields!');
      return;
    }
  
    // Validate StudentID format (if numeric-only)
    if (isNaN(studentData.StudentID) || studentData.StudentID.length < 10) {
      error('StudentID must be a valid number with at least 10 digits.');
      return;
    }
  
    // Validate TimeIn and TimeOut formats (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(studentData.TimeIn)) {
      error('Please enter a valid TimeIn in HH:MM format.');
      return;
    }
  
    if (studentData.TimeOut && !timeRegex.test(studentData.TimeOut)) {
      error('Please enter a valid TimeOut in HH:MM format.');
      return;
    }
  
    // Check if the email already exists
    const emailExists = await checkEmailExists(studentData.Email);
    if (emailExists) {
      warning('The email address is already in use. Please use a different email.');
      return;
    }
  
    try {
      setIsSubmitting(true);
      console.log('Student Data:', studentData);
  
      // Send POST request to the server
      const response = await axios.post('http://localhost:5000/stu/createstudents', studentData);
      console.log('Response:', response);
  
      // Check for successful response status (2xx range)
      if (response.status >= 200 && response.status < 300) {
        // Show success notification
        success('Student has been added successfully!');
        
        // Add system notification
        addStudentNotification(
          `New student ${studentData.FirstName} ${studentData.LastName} has been registered`,
          {
            actionText: 'View Student',
            actionUrl: '/dashboard/students'
          }
        );

        if (typeof fetchStudents === 'function') {
          fetchStudents();
        }
  
       // Clear form data after successful submission
        setStudentData({
          StudentID: '',
          FirstName: '',
          LastName: '',
          Email: '',
          PhoneNumber: '',
          DateOfBirth: '',
          Gender: '',
          Department: '',
          TimeIn: '',
          TimeOut: '',
        });
      } 
    } catch (error) {
      console.error('Error:', error);
  
      // Check for specific backend error messages
      const errorMessage = error || 'There was an issue adding the student. Please try again.';
  
      // Handling specific validation errors
      if (errorMessage.includes('Duplicate email')) {
        warning('This email is already registered. Please try a different one.');
      } else {
        error(errorMessage || 'There was an issue adding the student. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
    return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            mb: 1,
          }}
        >
          Student Management
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
        >
          Add new students to the system
        </Typography>
      </Box>
      
      <Paper 
        elevation={2}
        sx={{ 
          padding: { xs: 3, sm: 4, md: 6 },
          borderRadius: 3,
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Student ID"
                fullWidth
                name="StudentID"
                value={studentData.StudentID}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="First Name"
                fullWidth
                name="FirstName"
                value={studentData.FirstName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Last Name"
                fullWidth
                name="LastName"
                value={studentData.LastName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Email"
                fullWidth
                name="Email"
                value={studentData.Email}
                onChange={handleChange}
                required
                type="email"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Phone Number"
                fullWidth
                name="PhoneNumber"
                value={studentData.PhoneNumber}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Date of Birth"
                fullWidth
                name="DateOfBirth"
                value={studentData.DateOfBirth}
                onChange={handleChange}
                required
                type="date"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Time In"
                fullWidth
                name="TimeIn"
                value={studentData.TimeIn}
                onChange={handleChange}
                required
                type="time"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Time Out"
                fullWidth
                name="TimeOut"
                value={studentData.TimeOut}
                onChange={handleChange}
                type="time"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="Gender"
                  value={studentData.Gender}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  name="Department"
                  value={studentData.Department}
                  onChange={handleChange}
                  required
                  variant="outlined"
                >
                  <MenuItem value="R & I">R & I</MenuItem>
                  <MenuItem value="Faculty">Faculty</MenuItem>
                  <MenuItem value="Consultancy">Consultancy</MenuItem>
                  <MenuItem value="Corporate">Corporate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Student'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

StudentForm.propTypes = {
  fetchStudents: PropTypes.func,
};

StudentForm.defaultProps = {
  fetchStudents: undefined,
};

export default StudentForm;
