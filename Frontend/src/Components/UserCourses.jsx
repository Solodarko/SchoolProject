import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
} from '@mui/material';
import {
  School,
  PlayArrow,
  Assignment,
  Group,
  AccessTime,
  Star,
  BookmarkBorder,
  Bookmark,
  Download,
  Visibility,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const UserCourses = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Mock course data
  const mockCourses = [
    {
      id: 1,
      title: 'Advanced Mathematics',
      instructor: 'Dr. Sarah Johnson',
      progress: 75,
      totalLessons: 20,
      completedLessons: 15,
      nextLesson: 'Calculus Integration',
      category: 'Mathematics',
      rating: 4.8,
      isBookmarked: true,
      description: 'Advanced mathematical concepts including calculus, linear algebra, and differential equations.',
      materials: [
        { name: 'Lecture Notes - Chapter 5', type: 'pdf' },
        { name: 'Practice Problems Set 3', type: 'worksheet' },
        { name: 'Video Tutorial - Integration', type: 'video' }
      ]
    },
    {
      id: 2,
      title: 'Physics Fundamentals',
      instructor: 'Prof. Michael Chen',
      progress: 60,
      totalLessons: 15,
      completedLessons: 9,
      nextLesson: 'Quantum Mechanics Basics',
      category: 'Physics',
      rating: 4.6,
      isBookmarked: false,
      description: 'Fundamental principles of physics covering mechanics, thermodynamics, and quantum physics.',
      materials: [
        { name: 'Lab Manual - Experiment 4', type: 'pdf' },
        { name: 'Physics Equations Reference', type: 'pdf' },
        { name: 'Interactive Simulation', type: 'link' }
      ]
    },
    {
      id: 3,
      title: 'Computer Science Principles',
      instructor: 'Dr. Lisa Wang',
      progress: 90,
      totalLessons: 12,
      completedLessons: 11,
      nextLesson: 'Final Project Review',
      category: 'Computer Science',
      rating: 4.9,
      isBookmarked: true,
      description: 'Core computer science concepts including algorithms, data structures, and programming paradigms.',
      materials: [
        { name: 'Programming Assignment 3', type: 'code' },
        { name: 'Algorithm Complexity Guide', type: 'pdf' },
        { name: 'Code Review Examples', type: 'video' }
      ]
    },
    {
      id: 4,
      title: 'Chemistry Laboratory',
      instructor: 'Dr. Robert Smith',
      progress: 45,
      totalLessons: 18,
      completedLessons: 8,
      nextLesson: 'Organic Reactions',
      category: 'Chemistry',
      rating: 4.5,
      isBookmarked: false,
      description: 'Hands-on chemistry laboratory experience with organic and inorganic compounds.',
      materials: [
        { name: 'Safety Guidelines', type: 'pdf' },
        { name: 'Lab Report Template', type: 'doc' },
        { name: 'Chemical Properties Chart', type: 'pdf' }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCourses(mockCourses);
      setLoading(false);
    }, 1000);
  }, []);

  const handleBookmarkToggle = (courseId) => {
    setCourses(courses.map(course => 
      course.id === courseId 
        ? { ...course, isBookmarked: !course.isBookmarked }
        : course
    ));
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setOpenDialog(true);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Mathematics': return '#2196f3';
      case 'Physics': return '#4caf50';
      case 'Computer Science': return '#ff9800';
      case 'Chemistry': return '#9c27b0';
      default: return '#757575';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'info';
    if (progress >= 40) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading your courses...</Typography>
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={600}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            My Courses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Access your enrolled courses and track your learning progress
          </Typography>
        </Box>

        {/* Course Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {courses.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Enrolled Courses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assignment color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {courses.reduce((sum, course) => sum + course.completedLessons, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Lessons Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Star color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {courses.filter(course => course.isBookmarked).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Bookmarked
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccessTime color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Course Grid */}
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <Box
                  sx={{
                    height: 8,
                    background: `linear-gradient(45deg, ${getCategoryColor(course.category)}, ${getCategoryColor(course.category)}80)`
                  }}
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Chip 
                      label={course.category} 
                      size="small"
                      sx={{ 
                        bgcolor: `${getCategoryColor(course.category)}20`,
                        color: getCategoryColor(course.category),
                        fontWeight: 'bold'
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleBookmarkToggle(course.id)}
                    >
                      {course.isBookmarked ? <Bookmark color="warning" /> : <BookmarkBorder />}
                    </IconButton>
                  </Box>

                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {course.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Instructor: {course.instructor}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Star fontSize="small" color="warning" />
                    <Typography variant="body2">{course.rating}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {course.completedLessons}/{course.totalLessons} lessons
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={course.progress}
                      color={getProgressColor(course.progress)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {course.progress}% complete
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Next: {course.nextLesson}
                  </Typography>

                  <Box display="flex" gap={1} mt="auto">
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      fullWidth
                      onClick={() => handleViewCourse(course)}
                    >
                      Continue
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewCourse(course)}
                    >
                      View
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Course Detail Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedCourse && (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: getCategoryColor(selectedCourse.category) }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedCourse.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCourse.instructor}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                  <Tab label="Overview" />
                  <Tab label="Materials" />
                </Tabs>

                {tabValue === 0 && (
                  <Box>
                    <Typography variant="body1" paragraph>
                      {selectedCourse.description}
                    </Typography>
                    
                    <Box mb={3}>
                      <Typography variant="h6" gutterBottom>Course Progress</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedCourse.progress}
                        color={getProgressColor(selectedCourse.progress)}
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {selectedCourse.completedLessons} of {selectedCourse.totalLessons} lessons completed ({selectedCourse.progress}%)
                      </Typography>
                    </Box>

                    <Typography variant="h6" gutterBottom>Next Lesson</Typography>
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      {selectedCourse.nextLesson}
                    </Typography>
                  </Box>
                )}

                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Course Materials</Typography>
                    <List>
                      {selectedCourse.materials.map((material, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Download />
                          </ListItemIcon>
                          <ListItemText 
                            primary={material.name}
                            secondary={material.type.toUpperCase()}
                          />
                          <Button size="small" variant="outlined">
                            Download
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>
                  Close
                </Button>
                <Button variant="contained" startIcon={<PlayArrow />}>
                  Continue Learning
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Fade>
  );
};

export default UserCourses;
