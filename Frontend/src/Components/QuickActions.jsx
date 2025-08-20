
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Stack,
} from "@mui/material";
import {
  UserCheck,
  Users,
  FileText,
  Calendar,
  Zap,
} from "lucide-react";

const actions = [
  {
    title: "Take Attendance",
    description: "Mark student attendance for today",
    icon: UserCheck,
    color: "linear-gradient(to right, #3b82f6, #2563eb)", // blue
    action: "Start Session",
  },
  {
    title: "Add Students",
    description: "Register new students to the system",
    icon: Users,
    color: "linear-gradient(to right, #22c55e, #16a34a)", // green
    action: "Add Student",
  },
  {
    title: "Generate Report",
    description: "Create attendance reports",
    icon: FileText,
    color: "linear-gradient(to right, #8b5cf6, #7c3aed)", // purple
    action: "Create Report",
  },
  {
    title: "Schedule Class",
    description: "Set up new class sessions",
    icon: Calendar,
    color: "linear-gradient(to right, #f97316, #ea580c)", // orange
    action: "Schedule",
  },
];

export default function QuickActions() {
  return (
    <Card sx={{ bgcolor: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", boxShadow: 3 }}>
      <CardHeader
        avatar={<Zap size={20} color="#ca8a04" />} // text-yellow-600
        title={
          <Typography variant="h6" fontWeight={600}>
            Quick Actions
          </Typography>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Box
                key={index}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={2}
                borderRadius={2}
                bgcolor="#f9fafb"
                sx={{
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                    transition: "background-color 0.3s ease",
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    width={40}
                    height={40}
                    borderRadius={2}
                    sx={{
                      background: action.color,
                    }}
                  >
                    <IconComponent size={20} color="white" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: "#bfdbfe",
                    color: "#1d4ed8",
                    "&:hover": {
                      backgroundColor: "#eff6ff",
                      borderColor: "#93c5fd",
                    },
                  }}
                >
                  {action.action}
                </Button>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
