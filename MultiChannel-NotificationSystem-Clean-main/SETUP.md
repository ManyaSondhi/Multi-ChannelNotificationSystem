# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB (via Docker or local installation)
- Twilio account (for SMS functionality)
- SMTP credentials (for email functionality)

## Quick Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

### 2. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- **MongoDB URI**: Default is `mongodb://localhost:27017/notificationsystem`
- **JWT Secret**: Generate a strong secret for production
- **SMTP Settings**: Your email server configuration
- **Twilio Credentials**: Your Twilio Account SID, Auth Token, and Phone Number
- **VAPID Keys**: Generate using the script (see below)

### 3. Generate VAPID Keys (for WebPush)

```bash
node server/scripts/generate-vapid-keys.js
```

Copy the output keys to your `.env` file.

### 4. Start MongoDB

Using Docker Compose:
```bash
docker-compose up -d mongodb
```

Or use a local MongoDB installation.

### 5. Seed Database

Create initial admin user and sample templates:
```bash
npm run seed
```

This creates:
- Admin user: `admin@example.com` / `admin123`
- Test user: `user@example.com` / `user123`
- Sample templates (Welcome, Password Reset, Order Confirmation)

### 6. Start Development Server

```bash
# Start both backend and frontend
npm run dev

# Or start separately:
npm run server    # Backend on http://localhost:5000
npm run client    # Frontend on http://localhost:3000
```

### 7. Access the Application

- **Admin UI**: http://localhost:3000
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

Login with:
- Email: `admin@example.com`
- Password: `admin123`

## Testing Email Locally

For local email testing, use MailHog (included in docker-compose):

```bash
docker-compose up -d mailhog
```

- SMTP Server: `localhost:1025`
- Web UI: http://localhost:8025

Configure your `.env`:
```
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=test@example.com
```

## Twilio Sandbox Setup

1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from the dashboard
3. Get a phone number (use sandbox number for testing)
4. Configure webhook URL for delivery status:
   - URL: `https://your-domain.com/api/webhooks/twilio`
   - Method: POST

## WebPush Setup

1. Generate VAPID keys (see step 3 above)
2. In your frontend, request notification permission and subscribe:
```javascript
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY
  });
  // Send subscription to backend API
}
```

## API Usage Examples

### Send Notification

```bash
curl -X POST http://localhost:5000/api/notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "templateCode": "WELCOME",
    "data": {
      "appName": "My App",
      "name": "John Doe"
    },
    "channelHints": ["email", "sms"]
  }'
```

### Get Notification Status

```bash
curl http://localhost:5000/api/notifications/CORRELATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Project Structure

```
notificationsystem/
├── server/                 # Backend (Node.js/Express)
│   ├── models/            # MongoDB models
│   ├── adapters/          # Channel adapters (Email, SMS, WebPush)
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, validation, rate limiting
│   ├── utils/             # Helpers, logger
│   ├── scripts/           # Seed data, utilities
│   └── index.js           # Express server
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
│   └── public/
└── docker-compose.yml     # MongoDB and MailHog
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `docker-compose ps`
- Check MongoDB URI in `.env`
- Verify network connectivity

### Email Not Sending
- Check SMTP credentials
- For local testing, use MailHog
- Check firewall settings

### SMS Not Working
- Verify Twilio credentials
- Check phone number format (E.164: +1234567890)
- Ensure sufficient Twilio credits

### WebPush Not Working
- Verify VAPID keys are correctly set
- Check browser console for errors
- Ensure HTTPS in production (required for WebPush)

### Rate Limit Errors
- Check rate limit configuration in `.env`
- Reduce request frequency
- Increase limits for development

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure proper SMTP service
4. Use production Twilio account
5. Enable HTTPS (required for WebPush)
6. Configure proper MongoDB replica set
7. Set up monitoring and logging
8. Configure backup strategy
9. Set up CI/CD pipeline
10. Review security settings

## Support

For issues or questions, check the README.md or open an issue in the repository.

