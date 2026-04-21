import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Preview as PreviewIcon, Send as SendIcon } from '@mui/icons-material';
import { templateAPI, notificationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TemplatePreview = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [sampleData, setSampleData] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: template, isLoading } = useQuery(
    ['template', id],
    () => templateAPI.getById(id).then((res) => res.data.template),
    {
      enabled: !!id, // Only fetch if id exists
    }
  );

  const handlePreview = async (channel) => {
    if (!id) {
      setError('Template ID is missing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let data = {};
      if (sampleData) {
        data = JSON.parse(sampleData);
      }

      const response = await templateAPI.preview(id, channel, data);
      setPreviewData({ channel, ...response.data.rendered });
    } catch (err) {
      setError(err.response?.data?.error || 'Error previewing template');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async (channel) => {
    if (!id || !template) {
      setError('Template ID or template data is missing');
      return;
    }

    if (!window.confirm('Send test notification to yourself?')) return;

    setLoading(true);
    setError('');

    try {
      let data = {};
      if (sampleData) {
        data = JSON.parse(sampleData);
      }

      await notificationAPI.send({
        userId: user.id,
        templateCode: template.code,
        data,
        channelHints: [channel],
      });

      alert('Test notification sent!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error sending test notification');
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return (
      <Box>
        <Alert severity="error">Template ID is missing. Please navigate from the Templates page.</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={48} sx={{ color: '#2563EB' }} />
      </Box>
    );
  }

  if (!template) {
    return (
      <Box>
        <Alert
          severity="error"
          sx={{
            borderRadius: '12px',
            border: '2px solid #FEE2E2',
          }}
        >
          Template not found.
        </Alert>
      </Box>
    );
  }

  const channels = [];
  if (template?.channels.email?.enabled) channels.push('email');
  if (template?.channels.webpush?.enabled) channels.push('webpush');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Preview Template: {template?.name}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#0F172A',
            mb: 3,
          }}
        >
          Sample Data (JSON)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={sampleData}
          onChange={(e) => setSampleData(e.target.value)}
          placeholder='{"name": "John Doe", "appName": "My App"}'
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: '12px',
              border: '2px solid #FEE2E2',
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)',
            }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            borderBottom: '2px solid #EEF2FF',
            mb: 3,
            mt: 3,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9375rem',
                '&.Mui-selected': {
                  color: '#6366F1',
                },
              },
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(90deg, #6366F1 0%, #EC4899 100%)',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            {channels.map((channel) => (
              <Tab key={channel} label={channel.toUpperCase()} />
            ))}
          </Tabs>
        </Box>

        {channels.map((channel, index) => (
          <Box key={channel} hidden={activeTab !== index}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" gap={2} mb={2}>
                  <Button
                    variant="contained"
                    startIcon={<PreviewIcon />}
                    onClick={() => handlePreview(channel)}
                    disabled={loading}
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={() => handleSendTest(channel)}
                    disabled={loading}
                    sx={{
                      fontWeight: 600,
                      borderColor: '#2563EB',
                      color: '#2563EB',
                      '&:hover': {
                        borderColor: '#1E40AF',
                        backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      },
                    }}
                  >
                    Send Test
                  </Button>
                </Box>
              </Grid>

              {previewData && previewData.channel === channel && (
                <Grid item xs={12}>
                  <Card
                    sx={{
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: '#0F172A',
                          mb: 3,
                        }}
                      >
                        Preview ({channel})
                      </Typography>
                      {channel === 'email' && (
                        <Box>
                          <Typography variant="subtitle2">Subject:</Typography>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            {previewData.subject}
                          </Typography>
                          <Typography variant="subtitle2">HTML:</Typography>
                          <Box
                            dangerouslySetInnerHTML={{ __html: previewData.html }}
                            sx={{
                              border: '1px solid #ddd',
                              p: 2,
                              borderRadius: 1,
                              mb: 2,
                            }}
                          />
                          <Typography variant="subtitle2">Text:</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {previewData.text}
                          </Typography>
                        </Box>
                      )}
                      {channel === 'webpush' && (
                        <Box>
                          <Typography variant="subtitle2">Title:</Typography>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {previewData.title}
                          </Typography>
                          <Typography variant="subtitle2">Body:</Typography>
                          <Typography variant="body1">{previewData.body}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default TemplatePreview;


