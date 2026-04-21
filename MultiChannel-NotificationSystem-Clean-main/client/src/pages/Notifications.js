import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  Button,
  Grid,
} from '@mui/material';
import { Visibility as VisibilityIcon, Send as SendIcon } from '@mui/icons-material';
import { notificationAPI, templateAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const Notifications = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [filters, setFilters] = useState({ page: 1, limit: 20 });

  const { data, isLoading } = useQuery(
    ['notifications', filters],
    () => notificationAPI.list(filters).then((res) => res.data),
    { enabled: !!user }
  );

  const getStatusColor = (status) => {
    const colors = {
      sent: 'success',
      failed: 'error',
      pending: 'warning',
      processing: 'info',
      partial: 'warning', // Orange/warning color - some succeeded, some failed
    };
    return colors[status] || 'default';
  };

  // Generate smart sample data based on template variables
  const generateSampleData = (variables, user) => {
    const data = {};
    const now = new Date();
    
    // Helper to generate random values
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomCode = (prefix) => `${prefix}${randomInt(1000, 9999)}`;
    
    // Generate realistic dates and times
    const futureDate = new Date(now.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000);
    const sampleDate = futureDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const sampleTime = `${String(randomInt(9, 17)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;
    const sampleDateTime = `${futureDate.toLocaleDateString()} at ${sampleTime}`;
    
    // Common topic/subject examples
    const topics = ['Project Planning', 'Team Meeting', 'Client Review', 'Training Session', 'Performance Review', 'Strategy Discussion'];
    const sessionTopics = ['Web Development', 'Database Design', 'API Integration', 'System Architecture', 'Code Review', 'Sprint Planning'];
    
    // Map common variable patterns to sample values
    // IMPORTANT: Preserve original variable name case for template matching
    variables.forEach(variable => {
      const originalVar = variable.trim();
      const varPath = originalVar.split('.');
      const varNameLower = originalVar.toLowerCase();
      const baseNameLower = varPath[varPath.length - 1].toLowerCase().trim();
      const originalBaseName = varPath[varPath.length - 1].trim(); // Preserve case
      
      // Handle nested paths (e.g., data.discount, user.name)
      if (varPath.length > 1) {
        const parent = varPath[0].trim(); // Preserve case
        const childLower = varPath[1].toLowerCase().trim();
        const originalChild = varPath[1].trim(); // Preserve case
        
        if (!data[parent]) {
          data[parent] = {};
        }
        
        // Set value based on child name (use lowercase for matching, original for key)
        if (childLower === 'name' || childLower.includes('name')) {
          data[parent][originalChild] = user?.name || 'John Doe';
        } else if (childLower.includes('discount') || childLower.includes('percent') || childLower.includes('off')) {
          data[parent][originalChild] = randomInt(10, 50);
        } else if (childLower.includes('code') || childLower.includes('coupon')) {
          data[parent][originalChild] = randomCode('SAVE');
        } else if (childLower.includes('date') && !childLower.includes('time')) {
          data[parent][originalChild] = sampleDate;
        } else if (childLower.includes('time') && !childLower.includes('date')) {
          data[parent][originalChild] = sampleTime;
        } else if (childLower.includes('datetime') || (childLower.includes('date') && childLower.includes('time'))) {
          data[parent][originalChild] = sampleDateTime;
        } else if (childLower.includes('valid') || childLower.includes('until') || childLower.includes('expir')) {
          data[parent][originalChild] = futureDate.toLocaleDateString();
        } else if (childLower.includes('link') || childLower.includes('url')) {
          data[parent][originalChild] = `https://example.com/${originalChild.replace(/link|url/gi, '')}`;
        } else if (childLower.includes('order') && childLower.includes('number')) {
          data[parent][originalChild] = randomCode('ORD-');
        } else if (childLower.includes('total') || childLower.includes('amount') || childLower.includes('price')) {
          data[parent][originalChild] = (Math.random() * 1000 + 10).toFixed(2);
        } else if (childLower.includes('topic') || childLower.includes('subject') || childLower.includes('title')) {
          data[parent][originalChild] = sessionTopics[randomInt(0, sessionTopics.length - 1)];
        } else if (childLower.includes('session')) {
          data[parent][originalChild] = topics[randomInt(0, topics.length - 1)];
        } else {
          // For unknown nested variables, generate realistic value
          data[parent][originalChild] = `Value for ${originalChild}`;
        }
      } else {
        // Handle flat variables - preserve original case for key
        // Check patterns using lowercase, but use original name as key
        let value = null;
        
        // Exact matches (case-insensitive check, but preserve original case in key)
        if (baseNameLower === 'name') {
          value = user?.name || 'John Doe';
        } else if (baseNameLower === 'date') {
          value = sampleDate;
        } else if (baseNameLower === 'time') {
          value = sampleTime;
        } else if (baseNameLower === 'sessiontopic' || baseNameLower === 'session_topic') {
          value = sessionTopics[randomInt(0, sessionTopics.length - 1)];
        } else if (baseNameLower === 'topic') {
          value = sessionTopics[randomInt(0, sessionTopics.length - 1)];
        } else if (baseNameLower === 'session') {
          value = topics[randomInt(0, topics.length - 1)];
        }
        // Pattern matches
        else if (baseNameLower.includes('name') && !baseNameLower.includes('app') && !baseNameLower.includes('user') && !baseNameLower.includes('session')) {
          value = user?.name || 'John Doe';
        } else if (baseNameLower === 'appname' || baseNameLower === 'app_name' || baseNameLower.includes('appname')) {
          value = 'Notification System';
        } else if (baseNameLower.includes('email')) {
          value = user?.email || 'user@example.com';
        } else if (baseNameLower.includes('phone')) {
          value = user?.phone || '+1234567890';
        } else if (baseNameLower.includes('date') && !baseNameLower.includes('time')) {
          value = sampleDate;
        } else if (baseNameLower.includes('time') && !baseNameLower.includes('date')) {
          value = sampleTime;
        } else if (baseNameLower.includes('datetime') || (baseNameLower.includes('date') && baseNameLower.includes('time'))) {
          value = sampleDateTime;
        } else if (baseNameLower.includes('topic') || baseNameLower.includes('subject')) {
          if (baseNameLower.includes('session')) {
            value = sessionTopics[randomInt(0, sessionTopics.length - 1)];
          } else {
            value = topics[randomInt(0, topics.length - 1)];
          }
        } else if (baseNameLower.includes('session') && !baseNameLower.includes('topic')) {
          value = topics[randomInt(0, topics.length - 1)];
        } else if (baseNameLower.includes('link') || baseNameLower.includes('url')) {
          value = `https://example.com/${originalBaseName.replace(/link|url/gi, '')}`;
        } else if (baseNameLower.includes('reset') && baseNameLower.includes('link')) {
          value = `https://example.com/reset-password?token=${Math.random().toString(36).substring(7)}`;
        } else if (baseNameLower.includes('expir') || baseNameLower.includes('minutes')) {
          value = 30;
        } else if (baseNameLower.includes('order') && baseNameLower.includes('number')) {
          value = randomCode('ORD-');
        } else if (baseNameLower.includes('total') || baseNameLower.includes('amount')) {
          value = (Math.random() * 1000 + 10).toFixed(2);
        } else if (baseNameLower.includes('discount') || baseNameLower.includes('percent')) {
          value = randomInt(10, 50);
        } else if (baseNameLower.includes('code') || baseNameLower.includes('coupon')) {
          value = randomCode('SAVE');
        } else {
          // For unknown variables, generate realistic defaults based on name pattern
          if (baseNameLower.length <= 10) {
            value = randomCode(originalBaseName.toUpperCase().substring(0, Math.min(3, originalBaseName.length)));
          } else if (baseNameLower.endsWith('id')) {
            value = randomCode('ID-');
          } else if (baseNameLower.endsWith('number')) {
            value = randomCode('');
          } else {
            // Generate a meaningful value based on the variable name
            const words = originalBaseName.split(/(?=[A-Z])|_/).filter(w => w);
            if (words.length > 1) {
              value = words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            } else {
              value = originalBaseName.charAt(0).toUpperCase() + originalBaseName.slice(1);
            }
          }
        }
        
        // Set the value using the original variable name (preserves case)
        if (value !== null) {
          data[originalBaseName] = value;
        }
      }
    });
    
    return data;
  };

  const handleSendTest = async () => {
    // Open test notification dialog
    const templateCode = prompt('Enter template code (e.g., WELCOME):');
    if (!templateCode) return;

    try {
      // Fetch template to extract variables
      let template = null;
      let variables = [];
      try {
        const templateResponse = await templateAPI.getByCode(templateCode);
        template = templateResponse.data.template;
        // Extract variables from template (we'll do this on frontend for now)
        // For now, use a simple approach: check template content
        const allText = JSON.stringify(template.channels || {});
        const variableMatches = allText.match(/\{\{([^}]+)\}\}/g) || [];
        variables = [...new Set(variableMatches.map(m => m.replace(/[{}]/g, '').trim()))];
        console.log('[Test Notification] Extracted variables from template:', variables);
      } catch (err) {
        console.warn('Could not fetch template, using default data:', err);
      }

      // Generate sample data based on template variables
      let data = {};
      if (variables.length > 0) {
        data = generateSampleData(variables, user);
        console.log('[Test Notification] Generated sample data:', JSON.stringify(data, null, 2));
        console.log('[Test Notification] User name:', user?.name);
      } else {
        // Fallback to template-specific defaults
        if (templateCode === 'PASSWORD_RESET') {
          data = {
            name: user.name || 'User',
            resetLink: `https://example.com/reset-password?token=${Math.random().toString(36).substring(7)}`,
            expiryMinutes: 30,
          };
        } else if (templateCode === 'WELCOME') {
          data = {
            appName: 'Notification System',
            name: user.name || 'User',
          };
        } else if (templateCode === 'ORDER_CONFIRMATION') {
          data = {
            name: user.name || 'User',
            orderNumber: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            total: (Math.random() * 1000 + 10).toFixed(2),
          };
        } else {
          // For custom templates, provide comprehensive sample data
          data = {
            discount: Math.floor(Math.random() * 40 + 10), // 10-50%
            couponCode: `SAVE${Math.floor(Math.random() * 9000 + 1000)}`,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            offerLink: 'https://example.com/offers',
            feedbackLink: 'https://example.com/feedback',
            orderNumber: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            total: (Math.random() * 1000 + 10).toFixed(2),
            appName: 'Notification System',
            name: user.name || 'User',
          };
        }
      }

      console.log(`[Test Notification] Template: ${templateCode}`);
      console.log(`[Test Notification] Generated data:`, JSON.stringify(data, null, 2));
      console.log(`[Test Notification] Variables found:`, variables);

      const response = await notificationAPI.send({
        userId: user.id,
        templateCode,
        data,
        channelHints: ['email', 'webpush'],
      });
      alert(`Test notification sent! Correlation ID: ${response.data.correlationId}\n\nData used: ${JSON.stringify(data, null, 2)}`);
      window.location.reload();
    } catch (error) {
      const errorData = error.response?.data;
      let errorMessage = errorData?.message || errorData?.error || error.message;
      
      if (errorData?.details && Array.isArray(errorData.details)) {
        const details = errorData.details.map(d => {
          // Handle both object and string details
          if (typeof d === 'string') {
            return d;
          }
          return `${d.field || 'unknown'}: ${d.message || d}`;
        }).join('\n');
        errorMessage = `${errorMessage}\n\nDetails:\n${details}`;
      }
      
      alert(`Error: ${errorMessage}`);
      console.error('Notification send error:', error.response?.data || error);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1F2D3D',
              mb: 1,
            }}
          >
            Notifications
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#6B7280',
              fontSize: '0.9375rem',
            }}
          >
            View and manage your notifications
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendTest}
            sx={{
              fontWeight: 600,
            }}
          >
            Send Test
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={48} sx={{ color: '#2563EB' }} />
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: '#F8FAFC',
                    '& th': {
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#475569',
                      borderBottom: '1px solid #E2E8F0',
                      py: 2,
                      px: 3,
                    },
                  }}
                >
                  <TableCell>Correlation ID</TableCell>
                  <TableCell>Template</TableCell>
                  {isAdmin && <TableCell>User</TableCell>}
                  <TableCell>Status</TableCell>
                  <TableCell>Channels</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.notifications?.map((notification) => (
                  <TableRow
                    key={notification._id}
                    sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#F8FAFC',
                      },
                      '&:nth-of-type(even)': {
                        backgroundColor: '#FFFFFF',
                      },
                      '& td': {
                        borderBottom: '1px solid #F3F4F6',
                        py: 3,
                        px: 3,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.8125rem',
                          color: '#6B7280',
                        }}
                      >
                        {notification.correlationId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          color: '#1F2D3D',
                        }}
                      >
                        {notification.templateCode}
                      </Typography>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Typography
                          sx={{
                            color: '#6B7280',
                            fontSize: '0.875rem',
                          }}
                        >
                          {notification.userId?.name || notification.userId?.email}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={notification.status}
                        color={getStatusColor(notification.status)}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {notification.deliveries?.map((delivery) => (
                          <Chip
                            key={delivery.channel}
                            label={delivery.channel}
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              height: 24,
                              backgroundColor: '#F5F7FA',
                              color: '#6B7280',
                              fontWeight: 500,
                              textTransform: 'capitalize',
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          color: '#6B7280',
                          fontSize: '0.875rem',
                        }}
                      >
                        {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/notifications/${notification.correlationId}`)}
                      sx={{
                        color: '#2563EB',
                        '&:hover': {
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        },
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {data?.pagination && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total}{' '}
                total)
              </Typography>
              <Box>
                <Button
                  disabled={data.pagination.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  disabled={data.pagination.page >= data.pagination.pages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Notifications;

