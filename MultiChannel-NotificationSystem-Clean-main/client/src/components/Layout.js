import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Templates', icon: <EmailIcon />, path: '/templates', admin: true },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'Preferences', icon: <SettingsIcon />, path: '/preferences' },
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const filteredMenuItems = menuItems.filter((item) => !item.admin || isAdmin);

  const drawer = (
    <Box sx={{ overflow: 'auto', height: '100%', background: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)' }}>
      <Box
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.5rem',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          ⚡
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: '1.25rem',
              mb: 0.5,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            NotifyHub
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.75rem',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Notification System
          </Typography>
        </Box>
      </Box>
      <List sx={{ px: 2, py: 3 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: '12px',
                  py: 1.75,
                  px: 2.5,
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.15) 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)',
                      transform: 'translateX(4px)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#A78BFA',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: '70%',
                      background: 'linear-gradient(180deg, #6366F1 0%, #EC4899 100%)',
                      borderRadius: '0 4px 4px 0',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    transform: 'translateX(4px)',
                    '& .MuiListItemIcon-root': {
                      color: '#A78BFA',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? '#60A5FA' : 'rgba(255, 255, 255, 0.6)',
                    transition: 'color 0.2s',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9375rem',
                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: '1.125rem',
              display: { xs: 'none', sm: 'block' },
              color: '#0F172A',
            }}
          >
            NotifyHub
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>
                {user?.name}
              </Typography>
            </Box>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: '#F5F7FA',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: '#2563EB',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 8,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled sx={{ opacity: 1, py: 1.5 }}>
              <PersonIcon sx={{ mr: 1.5, color: '#6B7280' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1F2D3D' }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: '#F5F7FA',
                },
              }}
            >
              <LogoutIcon sx={{ mr: 1.5, color: '#6B7280' }} />
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#0F172A',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;







