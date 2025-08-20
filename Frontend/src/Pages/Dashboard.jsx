import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, Grid, Typography, Box, useTheme, CircularProgress } from '@mui/material';
import { useSpring, animated } from 'react-spring';
import PropTypes from 'prop-types';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Placeholder data for new KPIs
  const [kpiData, setKpiData] = useState({
    userGrowth: 1200,
    activeSessions: 850,
    engagementRate: '75%',
    revenueTrends: [
      { name: 'Jan', value: 400 },
      { name: 'Feb', value: 300 },
      { name: 'Mar', value: 200 },
      { name: 'Apr', value: 278 },
      { name: 'May', value: 189 },
      { name: 'Jun', value: 239 },
      { name: 'Jul', value: 349 },
    ],
    userGrowthData: [
      { name: 'Week 1', users: 100 },
      { name: 'Week 2', users: 150 },
      { name: 'Week 3', users: 120 },
      { name: 'Week 4', users: 200 },
    ],
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/stu/readstudents");
      const data = await response.json();
      setStudents(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching students:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const getDepartmentData = () => {
    const counts = students.reduce((acc, student) => {
      acc[student.Department] = (acc[student.Department] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: Number(((value / students.length) * 100).toFixed(1))
    }));
  };

  const departmentData = getDepartmentData();

  const CustomPieTooltip = ({ active = false, payload = [] }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: theme.palette.background.paper, padding: '8px', borderRadius: '8px', boxShadow: theme.shadows[3] }}>
          <Typography variant="body2" color="text.primary">{payload[0].name}</Typography>
          <Typography variant="body2" color="text.secondary">Students:{payload[0].value}</Typography>
          <Typography variant="body2" color="text.secondary">{payload[0].payload.percentage.toFixed(1)}%</Typography>
        </div>
      );
    }
    return null;
  };

  CustomPieTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        value: PropTypes.number,
        payload: PropTypes.shape({
          percentage: PropTypes.number,
        }),
      })
    ),
  };

  CustomPieTooltip.defaultProps = {
    active: false,
    payload: [],
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill={theme.palette.text.primary} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '12px' }}>
        {name}
      </text>
    );
  };

  // Animations
  const chartAnimation = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 200, friction: 20 },
  });

  const kpiAnimation = useSpring({
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
    config: { tension: 200, friction: 20 },
    delay: 200,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        p: 3, // Add some padding around the dashboard content
        bgcolor: 'background.default', // Use theme background color
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 1,
          }}
        >
          Analytics Dashboard
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
        >
          Visual insights and data analysis for student management
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <animated.div style={kpiAnimation}>
            <Card elevation={3} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  User Growth
                </Typography>
                <Typography variant="h3" component="div">
                  {kpiData.userGrowth}
                </Typography>
              </CardContent>
            </Card>
          </animated.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <animated.div style={kpiAnimation}>
            <Card elevation={3} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography variant="h3" component="div">
                  {kpiData.activeSessions}
                </Typography>
              </CardContent>
            </Card>
          </animated.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <animated.div style={kpiAnimation}>
            <Card elevation={3} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Engagement Rate
                </Typography>
                <Typography variant="h3" component="div">
                  {kpiData.engagementRate}
                </Typography>
              </CardContent>
            </Card>
          </animated.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <animated.div style={kpiAnimation}>
            <Card elevation={3} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Revenue Trend
                </Typography>
                <Typography variant="h3" component="div">
                  ${kpiData.revenueTrends[kpiData.revenueTrends.length - 1].value}K
                </Typography>
              </CardContent>
            </Card>
          </animated.div>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4}>
        {/* Department Distribution Pie Chart (Existing) */}
        <Grid item xs={12} md={6}>
          <animated.div style={chartAnimation}>
            <Card elevation={10} sx={{ bgcolor: 'background.paper' }}>
              <CardHeader title="Department Distribution" sx={{ color: 'text.primary' }} />
              <CardContent>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={({ active, payload }) => (
                        <CustomPieTooltip active={active} payload={payload} />
                      )} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </animated.div>
        </Grid>

        {/* Students per Department Bar Chart (Existing) */}
        <Grid item xs={12} md={6}>
          <animated.div style={chartAnimation}>
            <Card elevation={10} sx={{ bgcolor: 'background.paper' }}>
              <CardHeader title="Students per Department" sx={{ color: 'text.primary' }} />
              <CardContent>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                      <YAxis stroke={theme.palette.text.secondary} />
                      <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: 'none' }} itemStyle={{ color: theme.palette.text.primary }} />
                      <Legend />
                      <Bar dataKey="value" name="Students" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </animated.div>
        </Grid>

        {/* New Chart: User Growth */}
        <Grid item xs={12} md={6}>
          <animated.div style={chartAnimation}>
            <Card elevation={10} sx={{ bgcolor: 'background.paper' }}>
              <CardHeader title="User Growth" sx={{ color: 'text.primary' }} />
              <CardContent>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={kpiData.userGrowthData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                      <YAxis stroke={theme.palette.text.secondary} />
                      <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: 'none' }} itemStyle={{ color: theme.palette.text.primary }} />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </animated.div>
        </Grid>

        {/* New Chart: Revenue Trends */}
        <Grid item xs={12} md={6}>
          <animated.div style={chartAnimation}>
            <Card elevation={10} sx={{ bgcolor: 'background.paper' }}>
              <CardHeader title="Revenue Trends" sx={{ color: 'text.primary' }} />
              <CardContent>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={kpiData.revenueTrends}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                      <YAxis stroke={theme.palette.text.secondary} />
                      <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: 'none' }} itemStyle={{ color: theme.palette.text.primary }} />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#82ca9d" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </animated.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
