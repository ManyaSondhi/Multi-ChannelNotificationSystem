import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
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
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { templateAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Templates = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery('templates', () =>
    templateAPI.getAll().then((res) => res.data.templates)
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={48} sx={{ color: '#2563EB' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: '12px',
          border: '1px solid #FEE2E2',
        }}
      >
        Error loading templates
      </Alert>
    );
  }

  const getChannelChips = (template) => {
    const channels = [];
    if (template.channels.email?.enabled) channels.push('Email');
    if (template.channels.webpush?.enabled) channels.push('WebPush');
    return channels;
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
            Templates
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#6B7280',
              fontSize: '0.9375rem',
            }}
          >
            Manage your notification templates
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/templates/new')}
            sx={{
              fontWeight: 600,
            }}
          >
            New Template
          </Button>
        )}
      </Box>

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
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Channels</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Actions</TableCell>
              {isAdmin && <TableCell>Preview</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((template) => (
              <TableRow
                key={template._id}
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
                  <Chip
                    label={template.code}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      backgroundColor: '#2563EB',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      color: '#1F2D3D',
                    }}
                  >
                    {template.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      color: '#6B7280',
                      fontSize: '0.875rem',
                    }}
                  >
                    {template.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {getChannelChips(template).map((channel) => (
                      <Chip
                        key={channel}
                        label={channel}
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          height: 24,
                          backgroundColor: '#F5F7FA',
                          color: '#6B7280',
                          fontWeight: 500,
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
                    {template.version}
                  </Typography>
                </TableCell>
                <TableCell>
                  {isAdmin && (
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/templates/${template._id}`)}
                      sx={{
                        color: '#2563EB',
                        '&:hover': {
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/templates/${template._id}/preview`)}
                      sx={{
                        color: '#475569',
                        '&:hover': {
                          backgroundColor: 'rgba(71, 85, 105, 0.1)',
                        },
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Templates;

