import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { notificationAPI } from '../services/api';
import { format } from 'date-fns';

const NotificationDetail = () => {
  const { correlationId } = useParams();

  const { data, isLoading } = useQuery(
    ['notification', correlationId],
    () => notificationAPI.getByCorrelationId(correlationId).then((res) => res.data),
    { refetchInterval: 5000 } // Refresh every 5 seconds
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={48} sx={{ color: '#2563EB' }} />
      </Box>
    );
  }

  if (!data?.notification) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: '12px',
          border: '2px solid #FEE2E2',
        }}
      >
        Notification not found
      </Alert>
    );
  }

  const { notification, logs } = data;

  const getStatusColor = (status) => {
    const colors = {
      sent: 'success',
      delivered: 'success',
      failed: 'error',
      pending: 'warning',
      processing: 'info',
      partial: 'warning', // Orange/warning color - some succeeded, some failed
      bounced: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#111827',
            mb: 1,
          }}
        >
          Notification Details
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            fontSize: '0.9375rem',
          }}
        >
          View detailed information about this notification
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
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
              Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Correlation ID
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>
              {notification.correlationId}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Template
            </Typography>
            <Typography variant="body1" mb={2}>
              {notification.templateCode}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={notification.status}
              color={getStatusColor(notification.status)}
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1" mb={2}>
              {format(new Date(notification.createdAt), 'PPpp')}
            </Typography>

            {notification.sentAt && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Sent At
                </Typography>
                <Typography variant="body1" mb={2}>
                  {format(new Date(notification.sentAt), 'PPpp')}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
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
            {notification.deliveries?.map((delivery) => (
              <Box key={delivery.channel} sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip label={delivery.channel} size="small" />
                  <Chip
                    label={delivery.status}
                    color={getStatusColor(delivery.status)}
                    size="small"
                  />
                </Box>
                {delivery.error && (
                  <Typography variant="body2" color="error">
                    Error: {delivery.error}
                  </Typography>
                )}
                {delivery.externalId && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    ID: {delivery.externalId}
                  </Typography>
                )}
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12}>
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
              Delivery Logs
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Channel</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Error</TableCell>
                    <TableCell>Latency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{log.channel}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={getStatusColor(log.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.createdAt), 'PPpp')}
                      </TableCell>
                      <TableCell>{log.error || '-'}</TableCell>
                      <TableCell>
                        {log.latency ? `${log.latency}ms` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationDetail;


