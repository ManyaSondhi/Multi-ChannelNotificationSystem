# Quick Start Guide

## Installation Status ✅

Your dependencies are installed! The warnings you saw are normal and don't affect functionality.

## Next Steps

### 1. Configure Environment Variables

```bash
# From project root
cp .env.example .env
```

Edit `.env` with your configuration:
- MongoDB URI (default: `mongodb://localhost:27017/notificationsystem`)
- JWT Secret (generate a strong random string)
- SMTP credentials (or use MailHog for testing)
- Twilio credentials (optional for SMS)
- VAPID keys (generate below)

### 2. Generate VAPID Keys (for WebPush)

```bash
node server/scripts/generate-vapid-keys.js
```

Copy the output keys to your `.env` file.

### 3. Start MongoDB

Using Docker:
```bash
docker-compose up -d mongodb
```

Or use your local MongoDB installation.

### 4. Seed Database

```bash
npm run seed
```

This creates:
- Admin user: `admin@example.com` / `admin123`
- Test user: `user@example.com` / `user123`
- Sample templates

### 5. Start Development Servers

```bash
# From project root - starts both backend and frontend
npm run dev

# Or start separately:
npm run server    # Backend: http://localhost:5000
npm run client    # Frontend: http://localhost:3000
```

### 6. Access the Application

- **Admin UI**: http://localhost:3000
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

Login with:
- Email: `admin@example.com`
- Password: `admin123`

## Testing Email Locally (Optional)

For local email testing without a real SMTP server:

```bash
docker-compose up -d mailhog
```

Then configure `.env`:
```
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=test@example.com
```

View emails at: http://localhost:8025

## Troubleshooting

### Port Already in Use
- Backend (5000): Change `PORT` in `.env`
- Frontend (3000): React will automatically use the next available port

### MongoDB Connection Error
- Ensure MongoDB is running: `docker-compose ps`
- Check MongoDB URI in `.env`
- Verify network connectivity

### Module Not Found Errors
- Run `npm install` in both root and client directories
- Delete `node_modules` and `package-lock.json`, then reinstall

### React App Won't Start
- Check Node.js version (requires 18+)
- Clear browser cache
- Check console for specific errors

## First Test

1. Login to the admin UI
2. Go to Templates → Preview a template
3. Send a test notification to yourself
4. Check delivery status in Notifications

## Next Steps

- Configure your SMTP service for email
- Set up Twilio account for SMS (optional)
- Configure WebPush subscriptions in your frontend
- Customize templates for your use case
- Set up production environment variables

## Need Help?

- See `SETUP.md` for detailed setup instructions
- See `ARCHITECTURE.md` for system architecture
- See `FEATURES.md` for feature documentation
- See `README.md` for overview






