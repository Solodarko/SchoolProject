import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  School as SchoolIcon,
  ContactMail as ContactIcon,
  Home as HomeIcon,
  People as FamilyIcon,
  Preview as PreviewIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { apiService } from '../services/apiService';

const steps = ['Personal Info', 'Contact Details', 'Academic Info', 'Review & Submit'];

const initialFormData = {
  // Personal Information
  firstName: '',
  lastName: '',
  dateOfBirth: null,
  gender: '',
  bloodGroup: '',
  nationality: '',
  
  // Contact Information
  email: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  
  // Academic Information
  studentId: '',
  class: '',
  section: '',
  rollNumber: '',
  enrollmentDate: new Date(),
  previousSchool: '',
  
  // Parent/Guardian Information
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  parentOccupation: '',
  relationship: 'Father',
  emergencyContact: '',
  
  // Additional Information
  medicalConditions: '',
  allergies: '',
  notes: '',
};

const AddStudents = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [generatedStudentId, setGeneratedStudentId] = useState('');

  const classes = ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const genders = ['Male', 'Female', 'Other'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const relationships = ['Father', 'Mother', 'Guardian', 'Grandparent', 'Other'];

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ST${year}${random}`;
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        break;
        
      case 1: // Contact Details
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        break;
        
      case 2: // Academic Info
        if (!formData.class) newErrors.class = 'Class is required';
        if (!formData.section.trim()) newErrors.section = 'Section is required';
        if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Roll number is required';
        if (!formData.parentName.trim()) newErrors.parentName = 'Parent/Guardian name is required';
        if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Parent phone is required';
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === 2 && !formData.studentId) {
        // Auto-generate student ID if not provided
        setFormData(prev => ({
          ...prev,
          studentId: generateStudentId()
        }));
      }
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return; // Validate all required fields
    
    setLoading(true);
    try {
      // Prepare data for API
      const studentData = {
        StudentID: formData.studentId || generateStudentId(),
        FirstName: formData.firstName.trim(),
        LastName: formData.lastName.trim(),
        Email: formData.email.trim(),
        PhoneNumber: formData.phoneNumber.trim(),
        DateOfBirth: formData.dateOfBirth,
        Gender: formData.gender,
        BloodGroup: formData.bloodGroup,
        Nationality: formData.nationality.trim(),
        Address: formData.address.trim(),
        City: formData.city.trim(),
        State: formData.state.trim(),
        ZipCode: formData.zipCode.trim(),
        Class: formData.class,
        Section: formData.section.trim(),
        RollNumber: formData.rollNumber.trim(),
        EnrollmentDate: formData.enrollmentDate,
        PreviousSchool: formData.previousSchool.trim(),
        ParentName: formData.parentName.trim(),
        ParentEmail: formData.parentEmail.trim(),
        ParentPhone: formData.parentPhone.trim(),
        ParentOccupation: formData.parentOccupation.trim(),
        Relationship: formData.relationship,
        EmergencyContact: formData.emergencyContact.trim(),
        MedicalConditions: formData.medicalConditions.trim(),
        Allergies: formData.allergies.trim(),
        Notes: formData.notes.trim(),
      };

      const response = await apiService.students.create(studentData);
      
      setGeneratedStudentId(studentData.StudentID);
      setSuccessDialog(true);
      
    } catch (error) {
      console.error('Error creating student:', error);
      setErrors({ submit: 'Failed to add student. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setActiveStep(0);
    setErrors({});
    setSuccessDialog(false);
    setGeneratedStudentId('');
  };

  const handleSuccessClose = () => {
    setSuccessDialog(false);
    handleReset();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAddIcon color="primary" />
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={handleDateChange('dateOfBirth')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.dateOfBirth,
                      helperText: errors.dateOfBirth
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.gender}>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={handleInputChange('gender')}
                  label="Gender"
                >
                  {genders.map(gender => (
                    <MenuItem key={gender} value={gender}>{gender}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Blood Group</InputLabel>
                <Select
                  value={formData.bloodGroup}
                  onChange={handleInputChange('bloodGroup')}
                  label="Blood Group"
                >
                  {bloodGroups.map(group => (
                    <MenuItem key={group} value={group}>{group}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nationality"
                value={formData.nationality}
                onChange={handleInputChange('nationality')}
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContactIcon color="primary" />
                Contact Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address}
                onChange={handleInputChange('address')}
                error={!!errors.address}
                helperText={errors.address}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleInputChange('city')}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={handleInputChange('state')}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.zipCode}
                onChange={handleInputChange('zipCode')}
              />
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" />
                Academic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Student ID"
                value={formData.studentId}
                onChange={handleInputChange('studentId')}
                placeholder="Auto-generated if empty"
                helperText="Leave empty to auto-generate"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.class}>
                <InputLabel>Class</InputLabel>
                <Select
                  value={formData.class}
                  onChange={handleInputChange('class')}
                  label="Class"
                >
                  {classes.map(cls => (
                    <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Section"
                value={formData.section}
                onChange={handleInputChange('section')}
                error={!!errors.section}
                helperText={errors.section}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Roll Number"
                value={formData.rollNumber}
                onChange={handleInputChange('rollNumber')}
                error={!!errors.rollNumber}
                helperText={errors.rollNumber}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Enrollment Date"
                  value={formData.enrollmentDate}
                  onChange={handleDateChange('enrollmentDate')}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Previous School"
                value={formData.previousSchool}
                onChange={handleInputChange('previousSchool')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <FamilyIcon color="primary" />
                Parent/Guardian Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent/Guardian Name"
                value={formData.parentName}
                onChange={handleInputChange('parentName')}
                error={!!errors.parentName}
                helperText={errors.parentName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                value={formData.parentPhone}
                onChange={handleInputChange('parentPhone')}
                error={!!errors.parentPhone}
                helperText={errors.parentPhone}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Email"
                type="email"
                value={formData.parentEmail}
                onChange={handleInputChange('parentEmail')}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={formData.relationship}
                  onChange={handleInputChange('relationship')}
                  label="Relationship"
                >
                  {relationships.map(rel => (
                    <MenuItem key={rel} value={rel}>{rel}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parent Occupation"
                value={formData.parentOccupation}
                onChange={handleInputChange('parentOccupation')}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={formData.emergencyContact}
                onChange={handleInputChange('emergencyContact')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical Conditions"
                multiline
                rows={2}
                value={formData.medicalConditions}
                onChange={handleInputChange('medicalConditions')}
                placeholder="Any known medical conditions..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Any additional information..."
              />
            </Grid>
          </Grid>
        );
        
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PreviewIcon color="primary" />
                Review Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                    {formData.firstName[0]}{formData.lastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {formData.firstName} {formData.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.studentId || 'Auto-generated ID'}
                    </Typography>
                  </Box>
                  <Box ml="auto">
                    <Chip label={formData.class} color="primary" />
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography>{formData.email}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography>{formData.phoneNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography>
                      {formData.dateOfBirth ? formData.dateOfBirth.toLocaleDateString() : 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Class & Section</Typography>
                    <Typography>{formData.class} - {formData.section}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Roll Number</Typography>
                    <Typography>{formData.rollNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Parent/Guardian</Typography>
                    <Typography>{formData.parentName}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {errors.submit && (
              <Grid item xs={12}>
                <Alert severity="error">{errors.submit}</Alert>
              </Grid>
            )}
          </Grid>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Add New Student
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fill in the student information step by step
        </Typography>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}
        </CardContent>
        
        {/* Navigation Buttons */}
        <Box sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleReset}
            >
              Reset
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Adding Student...' : 'Add Student'}
              </Button>
            ) : (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={handleSuccessClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
          <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5">Student Added Successfully!</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            {formData.firstName} {formData.lastName} has been added to the system.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Student ID: <strong>{generatedStudentId}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={handleSuccessClose} variant="outlined">
            Close
          </Button>
          <Button variant="contained" href="/admin-dashboard/view-students">
            View All Students
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddStudents;

