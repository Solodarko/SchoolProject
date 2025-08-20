import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Alert,
  CircularProgress,
  Fade,
  Divider,
  Paper,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Person as UserIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Swal from 'sweetalert2';

const RoleManagement = () => {
  const theme = useTheme();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [openAddRole, setOpenAddRole] = useState(false);
  const [openEditRole, setOpenEditRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form data
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: {}
  });

  // Available permissions
  const availablePermissions = {
    'user_management': {
      label: 'User Management',
      description: 'Create, edit, and delete users',
      permissions: ['create_users', 'edit_users', 'delete_users', 'view_users']
    },
    'role_management': {
      label: 'Role & Permission Management',
      description: 'Manage roles and permissions',
      permissions: ['create_roles', 'edit_roles', 'delete_roles', 'view_roles']
    },
    'system_settings': {
      label: 'System Settings',
      description: 'Configure system settings',
      permissions: ['edit_settings', 'view_settings', 'backup_system']
    },
    'analytics': {
      label: 'Analytics & Reports',
      description: 'Access analytics and generate reports',
      permissions: ['view_analytics', 'generate_reports', 'export_data']
    },
    'meeting_management': {
      label: 'Meeting Management',
      description: 'Manage meetings and attendance',
      permissions: ['create_meetings', 'edit_meetings', 'delete_meetings', 'view_meetings']
    },
    'content_management': {
      label: 'Content Management',
      description: 'Manage platform content',
      permissions: ['create_content', 'edit_content', 'delete_content', 'publish_content']
    }
  };

  // Mock data
  const mockRoles = [
    {
      id: 1,
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      userCount: 2,
      permissions: {
        user_management: ['create_users', 'edit_users', 'delete_users', 'view_users'],
        role_management: ['create_roles', 'edit_roles', 'delete_roles', 'view_roles'],
        system_settings: ['edit_settings', 'view_settings', 'backup_system'],
        analytics: ['view_analytics', 'generate_reports', 'export_data'],
        meeting_management: ['create_meetings', 'edit_meetings', 'delete_meetings', 'view_meetings'],
        content_management: ['create_content', 'edit_content', 'delete_content', 'publish_content']
      },
      isSystem: true
    },
    {
      id: 2,
      name: 'Admin',
      description: 'Administrative access with limited permissions',
      userCount: 8,
      permissions: {
        user_management: ['create_users', 'edit_users', 'view_users'],
        analytics: ['view_analytics', 'generate_reports'],
        meeting_management: ['create_meetings', 'edit_meetings', 'view_meetings'],
        content_management: ['create_content', 'edit_content', 'publish_content']
      },
      isSystem: false
    },
    {
      id: 3,
      name: 'Manager',
      description: 'Department management with team oversight',
      userCount: 15,
      permissions: {
        user_management: ['view_users'],
        analytics: ['view_analytics'],
        meeting_management: ['create_meetings', 'edit_meetings', 'view_meetings'],
        content_management: ['create_content', 'edit_content']
      },
      isSystem: false
    },
    {
      id: 4,
      name: 'User',
      description: 'Standard user access',
      userCount: 1225,
      permissions: {
        meeting_management: ['view_meetings'],
        content_management: []
      },
      isSystem: true
    }
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setRoles(mockRoles);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch roles');
      setLoading(false);
    }
  };

  const handleAddRole = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: {}
    });
    setOpenAddRole(true);
  };

  const handleEditRole = (role) => {
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setSelectedRole(role);
    setOpenEditRole(true);
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      Swal.fire('Cannot Delete', 'System roles cannot be deleted.', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Role',
      text: `Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#grey',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setRoles(roles.filter(r => r.id !== role.id));
        Swal.fire('Deleted!', 'Role has been deleted.', 'success');
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete role.', 'error');
      }
    }
  };

  const handleSaveRole = async (isEdit = false) => {
    try {
      if (isEdit) {
        // Update role
        const updatedRoles = roles.map(r => 
          r.id === selectedRole.id 
            ? { ...r, ...roleForm }
            : r
        );
        setRoles(updatedRoles);
        setOpenEditRole(false);
        Swal.fire('Updated!', 'Role has been updated.', 'success');
      } else {
        // Add new role
        const newRole = {
          id: Date.now(),
          ...roleForm,
          userCount: 0,
          isSystem: false
        };
        setRoles([...roles, newRole]);
        setOpenAddRole(false);
        Swal.fire('Added!', 'New role has been created.', 'success');
      }
    } catch (err) {
      Swal.fire('Error!', 'Failed to save role.', 'error');
    }
  };

  const handlePermissionChange = (category, permission) => {
    const currentPermissions = roleForm.permissions[category] || [];
    const updatedPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];

    setRoleForm({
      ...roleForm,
      permissions: {
        ...roleForm.permissions,
        [category]: updatedPermissions
      }
    });
  };

  const getRoleIcon = (roleName) => {
    switch (roleName.toLowerCase()) {
      case 'super admin':
      case 'admin':
        return <AdminIcon color="error" />;
      case 'manager':
        return <ManagerIcon color="warning" />;
      case 'user':
        return <UserIcon color="primary" />;
      default:
        return <SecurityIcon color="info" />;
    }
  };

  const getTotalPermissions = (rolePermissions) => {
    return Object.values(rolePermissions).reduce((total, perms) => total + perms.length, 0);
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
            Role & Permission Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRole}
            sx={{ 
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
              }
            }}
          >
            Add Role
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Role Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {roles.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Roles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {roles.filter(r => !r.isSystem).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Custom Roles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {roles.filter(r => r.isSystem).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  System Roles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {roles.reduce((sum, r) => sum + r.userCount, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Roles List */}
        <Grid container spacing={3}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} lg={4} key={role.id}>
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                    {getRoleIcon(role.name)}
                    <Box flexGrow={1}>
                      <Typography variant="h6" fontWeight="bold">
                        {role.name}
                        {role.isSystem && (
                          <Chip 
                            label="System" 
                            size="small" 
                            color="default" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {role.description}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Users: <strong>{role.userCount}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Permissions: <strong>{getTotalPermissions(role.permissions)}</strong>
                    </Typography>
                  </Box>

                  {/* Permission Categories */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Permission Categories:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {Object.keys(role.permissions).map((category) => (
                        role.permissions[category].length > 0 && (
                          <Chip 
                            key={category}
                            label={availablePermissions[category]?.label || category}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )
                      ))}
                    </Box>
                  </Box>

                  <Box display="flex" gap={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditRole(role)}
                      disabled={role.isSystem && role.name === 'Super Admin'}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteRole(role)}
                      disabled={role.isSystem}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Add Role Dialog */}
        <Dialog open={openAddRole} onClose={() => setOpenAddRole(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Enter role name..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Enter role description..."
                />
              </Grid>
              
              {/* Permissions */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Permissions
                </Typography>
                {Object.entries(availablePermissions).map(([category, categoryData]) => (
                  <Paper key={category} elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {categoryData.label}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {categoryData.description}
                    </Typography>
                    <FormGroup row>
                      {categoryData.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission}
                          control={
                            <Checkbox
                              checked={(roleForm.permissions[category] || []).includes(permission)}
                              onChange={() => handlePermissionChange(category, permission)}
                            />
                          }
                          label={permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        />
                      ))}
                    </FormGroup>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddRole(false)}>Cancel</Button>
            <Button 
              onClick={() => handleSaveRole(false)} 
              variant="contained"
              disabled={!roleForm.name}
            >
              Create Role
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={openEditRole} onClose={() => setOpenEditRole(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  disabled={selectedRole?.isSystem && selectedRole?.name === 'Super Admin'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                />
              </Grid>
              
              {/* Permissions */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Permissions
                </Typography>
                {Object.entries(availablePermissions).map(([category, categoryData]) => (
                  <Paper key={category} elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {categoryData.label}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {categoryData.description}
                    </Typography>
                    <FormGroup row>
                      {categoryData.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission}
                          control={
                            <Checkbox
                              checked={(roleForm.permissions[category] || []).includes(permission)}
                              onChange={() => handlePermissionChange(category, permission)}
                              disabled={selectedRole?.isSystem && selectedRole?.name === 'Super Admin'}
                            />
                          }
                          label={permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        />
                      ))}
                    </FormGroup>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditRole(false)}>Cancel</Button>
            <Button 
              onClick={() => handleSaveRole(true)} 
              variant="contained"
              disabled={!roleForm.name}
            >
              Update Role
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default RoleManagement;
