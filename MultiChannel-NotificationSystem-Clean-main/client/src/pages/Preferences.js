import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import { preferenceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Convert VAPID public key from base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const Preferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [webpushStatus, setWebpushStatus] = useState('checking'); // checking, supported, unsupported, subscribed, error
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const { data, isLoading } = useQuery(
    ['preferences', user?.id],
    () => preferenceAPI.getByUserId(user?.id).then((res) => res.data.preference),
    { enabled: !!user?.id }
  );

  const { data: vapidKeyData } = useQuery(
    'vapid-key',
    () => preferenceAPI.getVapidPublicKey().then((res) => res.data),
    { enabled: !!user?.id }
  );

  const [formData, setFormData] = useState({
    channels: {
      email: { enabled: true, address: '' },
      webpush: { enabled: true },
    },
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
  });

  useEffect(() => {
    if (data) {
      setFormData({
        channels: data.channels || formData.channels,
        quietHours: data.quietHours || formData.quietHours,
      });
      
      // Check webpush subscription status
      if (data.channels?.webpush?.subscriptions && data.channels.webpush.subscriptions.length > 0) {
        setSubscriptionInfo(data.channels.webpush.subscriptions[0]);
        setWebpushStatus('subscribed');
      } else {
        setWebpushStatus('supported');
      }
    }
  }, [data]);

  // Check browser support on mount
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setWebpushStatus('supported');
    } else {
      setWebpushStatus('unsupported');
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && webpushStatus === 'supported') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          setWebpushStatus('error');
        });
    }
  }, [webpushStatus]);

  const mutation = useMutation(
    (updates) => preferenceAPI.update(user?.id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['preferences', user?.id]);
      },
    }
  );

  const subscribeMutation = useMutation(
    (subscription) => preferenceAPI.addWebPushSubscription(user?.id, subscription),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['preferences', user?.id]);
        setWebpushStatus('subscribed');
      },
      onError: (error) => {
        console.error('Subscription error:', error);
        alert('Failed to subscribe to web push notifications');
      },
    }
  );

  const unsubscribeMutation = useMutation(
    (endpoint) => preferenceAPI.removeWebPushSubscription(user?.id, endpoint),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['preferences', user?.id]);
        setWebpushStatus('supported');
        setSubscriptionInfo(null);
      },
      onError: (error) => {
        console.error('Unsubscription error:', error);
        alert('Failed to unsubscribe from web push notifications');
      },
    }
  );

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Web Push is not supported in this browser');
      return;
    }

    if (!vapidKeyData?.publicKey) {
      alert('VAPID public key not available. Please configure VAPID keys in the server.');
      return;
    }

    setIsRegistering(true);

    try {
      // Check current permission status first
      let permission = Notification.permission;
      
      // If permission was previously denied, show helpful message
      if (permission === 'denied') {
        setIsRegistering(false);
        alert(
          'Notifications are blocked for this site.\n\n' +
          'To enable:\n' +
          '1. Click the lock icon (🔒) in your browser address bar\n' +
          '2. Find "Notifications" and change it to "Allow"\n' +
          '3. Refresh this page and try again\n\n' +
          'Or go to: Settings → Privacy → Site Settings → Notifications'
        );
        return;
      }
      
      // Request notification permission
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission !== 'granted') {
        setIsRegistering(false);
        if (permission === 'denied') {
          alert(
            'Notification permission denied.\n\n' +
            'To enable notifications:\n' +
            '1. Click the lock icon (🔒) in your browser address bar\n' +
            '2. Change "Notifications" to "Allow"\n' +
            '3. Refresh this page and try again'
          );
        } else {
          alert('Notification permission not granted. Please enable notifications in your browser settings.');
        }
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKeyData.publicKey),
      });

      // Convert subscription to format expected by backend
      // The keys need to be base64 URL encoded (not standard base64)
      const keyToBase64 = (key) => {
        const keyArray = new Uint8Array(subscription.getKey(key));
        return btoa(String.fromCharCode.apply(null, keyArray))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keyToBase64('p256dh'),
          auth: keyToBase64('auth'),
        },
      };

      // Send to backend
      subscribeMutation.mutate(subscriptionData);
      setSubscriptionInfo(subscriptionData);
    } catch (error) {
      console.error('Error subscribing to push:', error);
      alert('Failed to subscribe to web push notifications: ' + error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscriptionInfo?.endpoint) {
      return;
    }

    try {
      // Unsubscribe from browser
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from backend
      unsubscribeMutation.mutate(subscriptionInfo.endpoint);
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      alert('Failed to unsubscribe from web push notifications: ' + error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={48} sx={{ color: '#276EF1' }} />
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
            color: '#1F2D3D',
            mb: 1,
          }}
        >
          Notification Preferences
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#6B7280',
            fontSize: '0.9375rem',
          }}
        >
          Manage your notification channel preferences
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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#1F2D3D',
              mb: 3,
            }}
          >
            Channels
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.channels.email.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        channels: {
                          ...formData.channels,
                          email: { ...formData.channels.email, enabled: e.target.checked },
                        },
                      })
                    }
                  />
                }
                label="Enable Email Notifications"
              />
              {formData.channels.email.enabled && (
                <TextField
                  fullWidth
                  label="Email Address"
                  value={formData.channels.email.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      channels: {
                        ...formData.channels,
                        email: { ...formData.channels.email, address: e.target.value },
                      },
                    })
                  }
                  sx={{ mt: 2 }}
                />
              )}
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.channels.webpush.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        channels: {
                          ...formData.channels,
                          webpush: { ...formData.channels.webpush, enabled: e.target.checked },
                        },
                      })
                    }
                  />
                }
                label="Enable Web Push Notifications"
              />
              {formData.channels.webpush.enabled && (
                <Box sx={{ mt: 2 }}>
                  {webpushStatus === 'unsupported' && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Web Push is not supported in this browser.
                    </Alert>
                  )}
                  {webpushStatus === 'checking' && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Checking browser support...
                    </Alert>
                  )}
                  {webpushStatus === 'supported' && !subscriptionInfo && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Click the button below to enable browser push notifications.
                      </Alert>
                      <Button
                        variant="outlined"
                        startIcon={<NotificationsIcon />}
                        onClick={handleSubscribe}
                        disabled={isRegistering || !vapidKeyData?.publicKey}
                      >
                        {isRegistering ? 'Subscribing...' : 'Subscribe to Push Notifications'}
                      </Button>
                      {!vapidKeyData?.publicKey && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                          VAPID keys not configured. Please configure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in server .env file.
                        </Typography>
                      )}
                    </Box>
                  )}
                  {webpushStatus === 'subscribed' && subscriptionInfo && (
                    <Box>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        You are subscribed to web push notifications.
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Alert>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleUnsubscribe}
                        disabled={unsubscribeMutation.isLoading}
                      >
                        {unsubscribeMutation.isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
                      </Button>
                    </Box>
                  )}
                  {webpushStatus === 'error' && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Failed to register service worker. Please check browser console for details.
                    </Alert>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Quiet Hours
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={formData.quietHours.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quietHours: { ...formData.quietHours, enabled: e.target.checked },
                  })
                }
              />
            }
            label="Enable Quiet Hours"
          />

          {formData.quietHours.enabled && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={formData.quietHours.start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quietHours: { ...formData.quietHours, start: e.target.value },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={formData.quietHours.end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quietHours: { ...formData.quietHours, end: e.target.value },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}

          {mutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Preferences saved successfully
            </Alert>
          )}

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error saving preferences
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Preferences;


