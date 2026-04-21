import React from 'react';
import { useQuery } from 'react-query';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  NotificationsActive as PushIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { notificationAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon, color }) => (
  <Card
    sx={{
      height: '100%',
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      transition: 'all 0.2s ease-in-out',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: color,
        borderRadius: '12px 12px 0 0',
      },
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        borderColor: color,
      },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              color: '#64748B',
              fontSize: '0.875rem',
              fontWeight: 500,
              mb: 1.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#0F172A',
              fontSize: '2rem',
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            color,
            fontSize: 40,
            opacity: 0.9,
            ml: 2,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery('deliveryStats', () =>
    notificationAPI.getStats().then((res) => res.data)
  );

  const channelStats = [
    { name: 'Email', sent: stats?.byStatus?.sent?.count || 0, icon: <EmailIcon />, color: '#1976d2' },
    { name: 'SMS', sent: stats?.byStatus?.sent?.count || 0, icon: <SmsIcon />, color: '#2e7d32' },
    { name: 'WebPush', sent: stats?.byStatus?.sent?.count || 0, icon: <PushIcon />, color: '#ed6c02' },
  ];

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={48} sx={{ color: '#2563EB' }} />
      </Box>
    );
  }

  const chartData = [
    { name: 'Sent', value: stats?.byStatus?.sent?.count || 0 },
    { name: 'Delivered', value: stats?.byStatus?.delivered?.count || 0 },
    { name: 'Failed', value: stats?.byStatus?.failed?.count || 0 },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1F2D3D',
            mb: 1,
          }}
        >
          Dashboard
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            fontSize: '0.9375rem',
          }}
        >
          Overview of your notification system
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Notifications"
            value={stats?.total || 0}
            icon={<TrendingUpIcon />}
            color="#2563EB"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sent"
            value={stats?.byStatus?.sent?.count || 0}
            icon={<EmailIcon />}
            color="#10B981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Delivered"
            value={stats?.byStatus?.delivered?.count || 0}
            icon={<PushIcon />}
            color="#2563EB"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed"
            value={stats?.byStatus?.failed?.count || 0}
            icon={<SmsIcon />}
            color="#EF4444"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                mb: 3,
              }}
            >
              Delivery Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  style={{ fontSize: '0.875rem' }}
                />
                <YAxis stroke="#64748B" style={{ fontSize: '0.875rem' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;


