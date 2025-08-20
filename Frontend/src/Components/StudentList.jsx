import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Paper,
  TablePagination,
  IconButton,
  Box,
  Typography,
  useTheme,
  Chip,
  Tooltip,
  Avatar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { Delete, Edit, FileDownload, VideoCall, PersonAdd, AccessTime } from "@mui/icons-material";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Add time formatting function
const formatTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const StudentList = () => {
  const theme = useTheme();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [editingRowId, setEditingRowId] = useState(null);
  const [editData, setEditData] = useState({});


  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/stu/readstudents-with-zoom");
        setStudents(response.data);
       
      } catch (error) {
        console.error("Error fetching students:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch students. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    // Call the fetchStudents function inside useEffect
    fetchStudents();
  }, []);
  
  const handleDelete = async (studentId) => {
    try {
      await axios.delete(`http://localhost:5000/stu/deletestudents/${studentId}`);
      
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Student has been deleted successfully.",
        
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete student. Please try again.",
      });
    }
  };


  const handleEdit = (student) => {
    Swal.fire({
      title: "Edit Student Information",
      html: `
        <div style="text-align: center; padding: 15px;">
          <div style="margin-bottom: 15px;">
            <h3 style="color: #1a237e; margin-bottom: 10px; font-size: 1.1rem;">Personal Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display: block; margin-bottom: 3px; color: #666; font-weight: 500;">First Name</label>
                <input 
                  id="swal-input-firstname" 
                  class="swal2-input" 
                  value="${student.FirstName}" 
                  style="width: 90%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin: 0 auto;"
                >
              </div>
              <div>
                <label style="display: block; margin-bottom: 3px; color: #666; font-weight: 500;">Last Name</label>
                <input 
                  id="swal-input-lastname" 
                  class="swal2-input" 
                  value="${student.LastName}" 
                  style="width: 90%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin: 0 auto;"
                >
              </div>
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="color: #1a237e; margin-bottom: 10px; font-size: 1.1rem;">Contact Information</h3>
            <div>
              <label style="display: block; margin-bottom: 3px; color: #666; font-weight: 500;">Email</label>
              <input 
                id="swal-input-email" 
                class="swal2-input" 
                value="${student.Email}" 
                style="width: 90%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin: 0 auto;"
              >
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <h3 style="color: #1a237e; margin-bottom: 10px; font-size: 1.1rem;">Time Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display: block; margin-bottom: 3px; color: #666; font-weight: 500;">Time In</label>
                <input 
                  id="swal-input-timeIn" 
                  type="time" 
                  value="${student.TimeIn || ''}" 
                  style="width: 90%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin: 0 auto;"
                >
              </div>
              <div>
                <label style="display: block; margin-bottom: 3px; color: #666; font-weight: 500;">Time Out</label>
                <input 
                  id="swal-input-timeOut" 
                  type="time" 
                  value="${student.TimeOut || ''}" 
                  style="width: 90%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin: 0 auto;"
                >
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#1a237e",
      cancelButtonColor: "#666",
      width: "500px",
      padding: "15px",
      customClass: {
        container: 'custom-swal-container',
        popup: 'custom-swal-popup',
        header: 'custom-swal-header',
        title: 'custom-swal-title',
        closeButton: 'custom-swal-close-button',
        content: 'custom-swal-content',
        confirmButton: 'custom-swal-confirm-button',
        cancelButton: 'custom-swal-cancel-button',
      },
      focusConfirm: false,
      preConfirm: () => {
        const firstName = document.getElementById("swal-input-firstname").value;
        const lastName = document.getElementById("swal-input-lastname").value;
        const email = document.getElementById("swal-input-email").value;
        const timeIn = document.getElementById("swal-input-timeIn").value;
        const timeOut = document.getElementById("swal-input-timeOut").value;

        // Validation
        if (!firstName || !lastName || !email) {
          if (!firstName) {
            Swal.showValidationMessage("First Name is required!");
          } else if (!lastName) {
            Swal.showValidationMessage("Last Name is required!");
          } else if (!email) {
            Swal.showValidationMessage("Email is required!");
          }
          return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage("Please enter a valid email address!");
          return false;
        }

        return { 
          FirstName: firstName, 
          LastName: lastName, 
          Email: email,
          TimeIn: timeIn,
          TimeOut: timeOut
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const updatedData = result.value;
        try {
          await axios.put(`http://localhost:5000/stu/updatestudents/${student._id}`, updatedData);
          Swal.fire({
            icon: "success",
            title: "Updated Successfully!",
            text: "Student information has been updated.",
            confirmButtonColor: "#1a237e",
            timer: 1500,
            timerProgressBar: true,
            position: 'center',
            showConfirmButton: false,
          });
          // Refresh the student list
          const response = await axios.get("http://localhost:5000/stu/readstudents");
          setStudents(response.data);
        } catch (error) {
          console.error("Error updating student:", error);
          Swal.fire({
            icon: "error",
            title: "Update Failed",
            text: "Failed to update student information. Please try again.",
            confirmButtonColor: "#1a237e",
            position: 'center',
          });
        }
      }
    });
  };
  
  
  

  const handleInputChange = (e, field) => {
    setEditData((prevData) => ({
      ...prevData,
      [field]: e.target.value,
    }));
  };

  const handleSave = async (studentId) => {
    try {
      await axios.put(
        `http://localhost:5000/stu/updatestudents/${studentId}`,
        editData
      );
      setEditingRowId(null);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Student information updated successfully.",
      });
    } catch (error) {
      console.error("Error saving student:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update student. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    setEditingRowId(null);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      students.map((student) => ({
        "Student ID": student.StudentID,
        "First Name": student.FirstName,
        "Last Name": student.LastName,
        "Email": student.Email,
        "Department": student.Department,
        "Time In": formatTime(student.TimeIn),
        "Time Out": formatTime(student.TimeOut),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "StudentList.xlsx");
  };


  const handleChangePage = (event, newPage) => {
    if (newPage * rowsPerPage < filteredStudents.length) {
      setPage(newPage);
    }
  };
  

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filterStudents = (students, query, tabFilter) => {
    let filtered = students;
    
    // Apply tab filter first
    if (tabFilter === 1) {
      // Show only students with Zoom activity
      filtered = students.filter(student => student.zoomData?.totalMeetingsAttended > 0);
    } else if (tabFilter === 2) {
      // Show only auto-created Zoom participants
      filtered = students.filter(student => student.zoomData?.isAutoCreated);
    }
    
    // Apply search query
    if (!query.trim()) return filtered;
    
    const queryLowerCase = query.toLowerCase();
    
    return filtered.filter((student) =>
      student.LastName.toLowerCase().includes(queryLowerCase) ||
      student.StudentID.toString().includes(query) ||
      student.FirstName.toLowerCase().includes(query) ||
      student.Email.toString().includes(query)
    );
  };
  
  const filteredStudents = filterStudents(students, searchQuery, tabValue);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  // Format duration in minutes to human readable
  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format last activity date
  const formatLastActivity = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 2 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            mb: 1,
          }}
        >
          Student Directory
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
        >
          Manage and view all registered students
        </Typography>
      </Box>
      
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Tabs Section */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={`All Students (${students.length})`}
              icon={<PersonAdd />}
              iconPosition="start"
            />
            <Tab 
              label={`Zoom Active (${students.filter(s => s.zoomData?.totalMeetingsAttended > 0).length})`}
              icon={<VideoCall />}
              iconPosition="start"
            />
            <Tab 
              label={`Zoom Only (${students.filter(s => s.zoomData?.isAutoCreated).length})`}
              icon={<AccessTime />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Header Section */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: 'wrap',
            gap: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={exportToExcel}
            sx={{ 
              minWidth: 150,
              height: 40
            }}
            startIcon={<FileDownload />}
          >
            Export to Excel
          </Button>
          <TextField
            label="Search Students"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ 
              minWidth: 300,
              maxWidth: 400,
              flexGrow: 1
            }}
          />
          <Box sx={{ 
            fontWeight: "bold",
            minWidth: 150,
            textAlign: "center"
          }}>
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              `Total: ${filteredStudents.length}`
            )}
          </Box>
        </Box>

        {/* Loading/Empty State Alert */}
        {!loading && students.length === 0 && (
          <Alert severity="info" sx={{ m: 2 }}>
            No students found. Join a Zoom meeting to automatically create student records from participants.
          </Alert>
        )}
        
        {!loading && filteredStudents.length === 0 && students.length > 0 && (
          <Alert severity="warning" sx={{ m: 2 }}>
            No students match the current filter or search criteria.
          </Alert>
        )}

        {/* Table Section */}
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <TableContainer 
            sx={{ 
              flexGrow: 1,
              overflow: 'auto',
              '& .MuiTable-root': {
                minWidth: 650,
              }
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:first-of-type': { borderTopLeftRadius: 4 },
                    minWidth: 100
                  }}>Student ID</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 120
                  }}>Name</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 200
                  }}>Email</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 120
                  }}>Department</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 80
                  }}>Time In</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 80
                  }}>Time Out</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 100
                  }}>Zoom Meetings</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 100
                  }}>Total Duration</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    minWidth: 120
                  }}>Last Activity</TableCell>
                  <TableCell sx={{ 
                    fontWeight: "bold",
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:last-of-type': { borderTopRightRadius: 4 },
                    minWidth: 120
                  }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? filteredStudents.slice(
                      page * rowsPerPage,
                      page * rowsPerPage + rowsPerPage
                    )
                  : filteredStudents
                ).map((student) => (
                  <TableRow 
                    key={student._id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    {editingRowId === student._id ? (
                      <>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={editData.StudentID}
                            onChange={(e) => handleInputChange(e, 'StudentID')}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              placeholder="First Name"
                              value={editData.FirstName}
                              onChange={(e) => handleInputChange(e, 'FirstName')}
                            />
                            <TextField
                              size="small"
                              placeholder="Last Name"
                              value={editData.LastName}
                              onChange={(e) => handleInputChange(e, 'LastName')}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={editData.Email}
                            onChange={(e) => handleInputChange(e, 'Email')}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={editData.Department}
                            onChange={(e) => handleInputChange(e, 'Department')}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            size="small"
                            value={editData.TimeIn || ""}
                            onChange={(e) => handleInputChange(e, "TimeIn")}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="time"
                            size="small"
                            value={editData.TimeOut || ""}
                            onChange={(e) => handleInputChange(e, "TimeOut")}
                          />
                        </TableCell>
                        {/* Zoom data columns - not editable */}
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            Zoom data (read-only)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            Duration (read-only)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            Activity (read-only)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleSave(student._id)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              onClick={handleCancel}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {student.zoomData?.isAutoCreated && (
                              <Tooltip title="Auto-created from Zoom">
                                <Chip 
                                  size="small" 
                                  label="Zoom" 
                                  color="primary" 
                                  variant="outlined"
                                  icon={<VideoCall />}
                                />
                              </Tooltip>
                            )}
                            {student.StudentID}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                              {student.FirstName?.[0]}{student.LastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {student.FirstName} {student.LastName}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{student.Email}</TableCell>
                        <TableCell>{student.Department || 'N/A'}</TableCell>
                        <TableCell>{formatTime(student.TimeIn)}</TableCell>
                        <TableCell>{formatTime(student.TimeOut)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={`Total meetings: ${student.zoomData?.totalMeetingsAttended || 0}`}>
                              <Chip 
                                size="small"
                                label={student.zoomData?.totalMeetingsAttended || 0}
                                color={student.zoomData?.totalMeetingsAttended > 0 ? 'success' : 'default'}
                                variant="filled"
                              />
                            </Tooltip>
                            {student.zoomData?.totalMeetingsAttended > 0 && (
                              <VideoCall color="success" sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`Total participation time`}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 500,
                                color: student.zoomData?.totalDurationMinutes > 60 ? 'success.main' : 'text.secondary'
                              }}
                            >
                              {formatDuration(student.zoomData?.totalDurationMinutes)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {formatLastActivity(student.zoomData?.lastActivity)}
                            </Typography>
                            {student.zoomData?.lastActivity && (
                              <AccessTime 
                                sx={{ 
                                  fontSize: 12, 
                                  color: 'text.secondary',
                                  ml: 0.5 
                                }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit student">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleEdit(student)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete student">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() =>
                                  Swal.fire({
                                    title: "Confirm Delete",
                                    text: "Are you sure you want to delete this student?",
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonText: "Yes, delete it!",
                                    cancelButtonText: "Cancel",
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      handleDelete(student._id);
                                    }
                                  })
                                }
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Section */}
          <Box sx={{ 
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: 'background.paper'
          }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredStudents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '.MuiTablePagination-select': {
                  minWidth: '80px'
                }
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default StudentList;
