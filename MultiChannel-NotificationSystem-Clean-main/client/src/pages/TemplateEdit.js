import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { templateAPI } from '../services/api';

const TemplateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Check if creating new template (id is 'new' or undefined for new templates)
  const isNew = !id || id === 'new' || id === 'undefined' || id === 'new:1' || (id && id.startsWith('new:'));
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    channels: {
      email: { enabled: false, subject: '', html: '', text: '' },
      webpush: { enabled: false, title: '', body: '', icon: '', badge: '' },
    },
  });

  const { data: template, isLoading } = useQuery(
    ['template', id],
    () => {
      if (!id || id === 'undefined' || id === 'new' || id === 'new:1' || (id && id.startsWith('new:'))) {
        return Promise.reject(new Error('Invalid template ID'));
      }
      return templateAPI.getById(id).then((res) => res.data.template);
    },
    { 
      enabled: !isNew && !!id && id !== 'undefined' && id !== 'new' && id !== 'new:1' && !id.startsWith('new:'),
      retry: false,
      onError: (error) => {
        // Only log if it's not an expected error (like invalid ID)
        if (error.message !== 'Invalid template ID' && !error.message.includes('Invalid template ID')) {
          console.error('Error fetching template:', error);
        }
      }
    }
  );

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        code: template.code || '',
        description: template.description || '',
        channels: {
          email: template.channels.email || { enabled: false, subject: '', html: '', text: '' },
          webpush: template.channels.webpush || { enabled: false, title: '', body: '', icon: '', badge: '' },
        },
      });
    }
  }, [template]);
  
  // Reset form when switching between new and edit
  useEffect(() => {
    if (isNew) {
      setFormData({
        name: '',
        code: '',
        description: '',
        channels: {
          email: { enabled: false, subject: '', html: '', text: '' },
          webpush: { enabled: false, title: '', body: '', icon: '', badge: '' },
        },
      });
      setActiveTab(0);
    }
  }, [isNew]);

  const mutation = useMutation(
    (data) => {
      if (isNew) {
        return templateAPI.create(data);
      } else {
        if (!id || id === 'undefined' || id === 'new' || id === 'new:1' || (id && id.startsWith('new:'))) {
          throw new Error('Invalid template ID');
        }
        return templateAPI.update(id, data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates');
        queryClient.invalidateQueries(['template', id]);
        navigate('/templates');
      },
      onError: (error) => {
        console.error('Template mutation error:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred while saving the template';
        alert(`Error: ${errorMessage}`);
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name || !formData.name.trim()) {
      alert('Template name is required');
      return;
    }
    
    if (!formData.code || !formData.code.trim()) {
      alert('Template code is required');
      return;
    }
    
    // Validate code format (uppercase letters, numbers, underscores only)
    if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      alert('Template code must contain only uppercase letters, numbers, and underscores');
      return;
    }
    
    // Clean up the form data before sending
    // Explicitly build the data object to avoid sending any unwanted fields
    const cleanedData = {
      code: formData.code.toUpperCase().trim(),
      name: formData.name.trim(),
    };
    
    // Add description only if it's not empty
    if (formData.description && formData.description.trim()) {
      cleanedData.description = formData.description.trim();
    }
    
    // Build channels object
    cleanedData.channels = {};
    
    // Email channel
    if (formData.channels.email.enabled) {
      cleanedData.channels.email = {
        enabled: true,
        ...(formData.channels.email.subject && { subject: formData.channels.email.subject }),
        ...(formData.channels.email.html && { html: formData.channels.email.html }),
        ...(formData.channels.email.text && { text: formData.channels.email.text }),
      };
    } else {
      cleanedData.channels.email = { enabled: false };
    }
    
    // WebPush channel
    if (formData.channels.webpush.enabled) {
      cleanedData.channels.webpush = {
        enabled: true,
        ...(formData.channels.webpush.title && { title: formData.channels.webpush.title }),
        ...(formData.channels.webpush.body && { body: formData.channels.webpush.body }),
        ...(formData.channels.webpush.icon && { icon: formData.channels.webpush.icon }),
        ...(formData.channels.webpush.badge && { badge: formData.channels.webpush.badge }),
      };
    } else {
      cleanedData.channels.webpush = { enabled: false };
    }
    
    console.log('Sending template data:', JSON.stringify(cleanedData, null, 2));
    mutation.mutate(cleanedData);
  };

  const updateChannel = (channel, field, value) => {
    setFormData((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          [field]: value,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#0F172A',
            mb: 1,
          }}
        >
          {isNew ? 'Create Template' : 'Edit Template'}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            fontSize: '0.9375rem',
          }}
        >
          {isNew ? 'Create a new notification template' : 'Edit existing template'}
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 3,
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                helperText="Uppercase letters, numbers, and underscores only"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab label="Email" />
              <Tab label="WebPush" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.channels.email.enabled}
                    onChange={(e) => updateChannel('email', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Email"
              />
              {formData.channels.email.enabled && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      value={formData.channels.email.subject}
                      onChange={(e) => updateChannel('email', 'subject', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="HTML Body"
                      value={formData.channels.email.html}
                      onChange={(e) => updateChannel('email', 'html', e.target.value)}
                      multiline
                      rows={6}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Text Body"
                      value={formData.channels.email.text}
                      onChange={(e) => updateChannel('email', 'text', e.target.value)}
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.channels.webpush.enabled}
                    onChange={(e) => updateChannel('webpush', 'enabled', e.target.checked)}
                  />
                }
                label="Enable WebPush"
              />
              {formData.channels.webpush.enabled && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={formData.channels.webpush.title}
                      onChange={(e) => updateChannel('webpush', 'title', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Body"
                      value={formData.channels.webpush.body}
                      onChange={(e) => updateChannel('webpush', 'body', e.target.value)}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {mutation.error.response?.data?.message || 
                 mutation.error.response?.data?.error || 
                 'Error saving template'}
              </Typography>
              {mutation.error.response?.data?.details && (
                <Box sx={{ mt: 1 }}>
                  {Array.isArray(mutation.error.response.data.details) ? (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {mutation.error.response.data.details.map((detail, index) => (
                        <li key={index}>
                          <Typography variant="body2">
                            {typeof detail === 'string' 
                              ? detail 
                              : `${detail.field || 'Field'}: ${detail.message || detail}`}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {JSON.stringify(mutation.error.response.data.details, null, 2)}
                    </Typography>
                  )}
                </Box>
              )}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={() => navigate('/templates')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default TemplateEdit;


