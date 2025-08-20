import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, Typography, Box } from '@mui/material';

const data = [
  { name: 'Mon', attendance: 92, target: 90 },
  { name: 'Tue', attendance: 89, target: 90 },
  { name: 'Wed', attendance: 94, target: 90 },
  { name: 'Thu', attendance: 87, target: 90 },
  { name: 'Fri', attendance: 91, target: 90 },
  { name: 'Sat', attendance: 85, target: 90 },
  { name: 'Sun', attendance: 88, target: 90 },
];

export function AttendanceChart() {
  return (
    <Card elevation={3} sx={{ height: 320 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Weekly Attendance vs Target
        </Typography>
        <Box sx={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#607d8b" fontSize={12} />
              <YAxis stroke="#607d8b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
