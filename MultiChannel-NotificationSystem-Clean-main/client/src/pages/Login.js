import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        backgroundImage: 'linear-gradient(to bottom, #1E293B 0%, #0F172A 100%)',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'fadeIn 0.5s ease-in',
            '@keyframes fadeIn': {
              from: {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Box
            sx={{
              mb: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '12px',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.5rem',
                mb: 2,
              }}
            >
              N
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: 'white',
                  fontSize: '1.75rem',
                  mb: 1,
                }}
              >
                NotifyHub
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.875rem',
                }}
              >
                Sign in to your account
              </Typography>
            </Box>
          </Box>

          <Paper
            sx={{
              p: { xs: 3, sm: 4 },
              width: '100%',
              maxWidth: '400px',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              backgroundColor: '#FFFFFF',
            }}
          >

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: '12px',
                  border: '2px solid #FEE2E2',
                  background: 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)',
                  '& .MuiAlert-icon': {
                    color: '#EF4444',
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  mb: 2,
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  backgroundColor: '#2563EB',
                  '&:hover': {
                    backgroundColor: '#1E40AF',
                  },
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: '8px',
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
              }}
            >
              <Typography
                variant="body2"
                align="center"
                sx={{ color: '#475569', fontSize: '0.8125rem' }}
              >
                <strong>Demo credentials:</strong> admin@example.com / admin123
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;


