import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Users, Clock, TrendingUp, Calendar } from 'lucide-react';

const AttendanceReports = () => {
  const [loading, setLoading] = useState(false);
  const [meetingReport, setMeetingReport] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [meetingId, setMeetingId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:5000/api';

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    // Auto-refresh dashboard every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE}/attendance-reports/dashboard?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const generateMeetingReport = async (exportFormat = 'json') => {
    if (!meetingId.trim()) {
      setError('Please enter a meeting ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = `${API_BASE}/attendance-reports/meeting/${meetingId}${exportFormat !== 'json' ? `?format=${exportFormat}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Meeting not found or error generating report');
      }

      if (exportFormat === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `attendance-${meetingId}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const data = await response.json();
        setMeetingReport(data);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateStudentReport = async () => {
    if (!studentId.trim()) {
      setError('Please enter a student ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/attendance-reports/student/${studentId}`);
      if (!response.ok) {
        throw new Error('Student not found or error generating report');
      }
      const data = await response.json();
      setStudentReport(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late/partial': return 'bg-yellow-100 text-yellow-800';
      case 'brief attendance': return 'bg-orange-100 text-orange-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📊 Attendance Reports</h1>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Live Dashboard Stats */}
      {dashboardData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Live Dashboard - {timeframe}
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32 ml-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.liveStats.activeMeetings}</div>
                <div className="text-sm text-blue-800">Active Meetings</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dashboardData.liveStats.activeParticipants}</div>
                <div className="text-sm text-green-800">Live Participants</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dashboardData.liveStats.totalParticipants}</div>
                <div className="text-sm text-purple-800">Total Participants</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{formatDuration(dashboardData.liveStats.averageSessionDuration)}</div>
                <div className="text-sm text-orange-800">Avg Duration</div>
              </div>
            </div>

            {/* Active Meetings */}
            {dashboardData.activeMeetings?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Active Meetings</h3>
                <div className="space-y-2">
                  {dashboardData.activeMeetings.map(meeting => (
                    <div key={meeting.meetingId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{meeting.topic}</div>
                        <div className="text-sm text-gray-600">ID: {meeting.meetingId}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          {meeting.participantCount} participants
                        </div>
                        <Badge className="mt-1" variant="outline">{meeting.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meeting Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Meeting Attendance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter Meeting ID (e.g., 123456789)"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => generateMeetingReport()} 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Report'}
            </Button>
            <Button 
              onClick={() => generateMeetingReport('csv')} 
              variant="outline"
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>

          {meetingReport && (
            <div className="space-y-6">
              {/* Meeting Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-800">Meeting Details</div>
                  <div className="text-sm mt-2">
                    <div><strong>Topic:</strong> {meetingReport.summary.meetingInfo.topic}</div>
                    <div><strong>Duration:</strong> {formatDuration(meetingReport.summary.meetingInfo.duration)}</div>
                    <div><strong>Host:</strong> {meetingReport.summary.meetingInfo.hostEmail}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-800">Attendance Summary</div>
                  <div className="text-sm mt-2">
                    <div><strong>Total:</strong> {meetingReport.summary.attendance.totalParticipants}</div>
                    <div><strong>Present:</strong> {meetingReport.summary.attendance.present}</div>
                    <div><strong>Late:</strong> {meetingReport.summary.attendance.late}</div>
                    <div><strong>Absent:</strong> {meetingReport.summary.attendance.absent}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-purple-800">Participation</div>
                  <div className="text-sm mt-2">
                    <div><strong>Avg Duration:</strong> {formatDuration(meetingReport.summary.participation.averageDuration)}</div>
                    <div><strong>Peak Participants:</strong> {meetingReport.summary.participation.peakParticipants}</div>
                    <div><strong>Unique Participants:</strong> {meetingReport.summary.participation.uniqueParticipants}</div>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Participants</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Email</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Duration</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Attendance %</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetingReport.participants?.map((participant, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">
                            {participant.studentInfo?.name || participant.participantName}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">{participant.email || 'N/A'}</td>
                          <td className="border border-gray-200 px-4 py-2">{formatDuration(participant.duration)}</td>
                          <td className="border border-gray-200 px-4 py-2">{participant.attendancePercentage}%</td>
                          <td className="border border-gray-200 px-4 py-2">
                            <Badge className={getStatusColor(participant.status)}>{participant.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>🎓 Student Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={generateStudentReport} 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Report'}
            </Button>
          </div>

          {studentReport && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-800">Student Information</div>
                  <div className="text-sm mt-2">
                    <div><strong>Name:</strong> {studentReport.summary.student.name}</div>
                    <div><strong>ID:</strong> {studentReport.summary.student.studentId}</div>
                    <div><strong>Email:</strong> {studentReport.summary.student.email}</div>
                    <div><strong>Department:</strong> {studentReport.summary.student.department}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-800">Attendance Statistics</div>
                  <div className="text-sm mt-2">
                    <div><strong>Total Meetings:</strong> {studentReport.summary.statistics.totalMeetings}</div>
                    <div><strong>Average Attendance:</strong> {studentReport.summary.statistics.averageAttendance}%</div>
                    <div><strong>Total Hours:</strong> {studentReport.summary.statistics.totalHours}h</div>
                    <div><strong>Perfect Attendance:</strong> {studentReport.summary.statistics.perfectAttendance}</div>
                  </div>
                </div>
              </div>

              {/* Attendance History */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Attendance History</h3>
                <div className="space-y-2">
                  {studentReport.attendanceHistory?.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{record.meetingTopic}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(record.joinTime).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatDuration(record.duration)} ({record.attendancePercentage}%)
                        </div>
                        <Badge className={`mt-1 ${getStatusColor(record.status)}`}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReports;
