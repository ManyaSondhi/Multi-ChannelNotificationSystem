# Unified Notification System

A comprehensive MERN stack notification system that sends Email, SMS (Twilio), and WebPush notifications from a single API.

## Features

- **Unified Send API** - One endpoint to send notifications across multiple channels
- **Channel Adapters** - Pluggable adapters for Email (Nodemailer), SMS (Twilio), and WebPush (VAPID)
- **User Preferences** - Per-user channel preferences with quiet hours and fallback routing
- **Templates** - Versioned templates with variable substitution and localization
- **Delivery Tracking** - Comprehensive delivery logs with status timeline
- **Reliability** - Retry logic, idempotency, and dead-letter queue
- **Security** - JWT authentication, input validation, webhook verification
- **React Admin UI** - Manage templates, preferences, and view delivery status
- **Rate Limiting** - Per-user/channel quotas to prevent abuse
- **Observability** - Structured logging and metrics

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (via Docker or local installation)
- Twilio account (for SMS)
- SMTP credentials (for email)

### Setup

1. **Clone and install dependencies:**
```bash
npm run install-all
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start MongoDB (using Docker):**
```bash
docker-compose up -d mongodb
```

4. **Generate VAPID keys (for WebPush):**
```bash
node server/scripts/generate-vapid-keys.js
```

5. **Seed database:**
```bash
npm run seed
```

6. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:5000` and the React admin UI at `http://localhost:3000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Notifications
- `POST /api/notifications/send` - Send notification (unified endpoint)
- `GET /api/notifications/:correlationId` - Get notification status
- `GET /api/notifications` - List notifications with filters

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `GET /api/templates/:id/preview` - Preview template with sample data

### Preferences
- `GET /api/preferences/:userId` - Get user preferences
- `PUT /api/preferences/:userId` - Update user preferences

### Webhooks
- `POST /api/webhooks/twilio` - Twilio delivery status webhook

## Project Structure

```
notificationsystem/
├── server/
│   ├── models/          # MongoDB models
│   ├── adapters/        # Channel adapters (Email, SMS, WebPush)
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, rate limiting
│   ├── utils/           # Helpers, logger, config
│   ├── scripts/         # Seed data, VAPID key generation
│   └── index.js         # Express server entry
├── client/              # React admin UI
└── docker-compose.yml   # MongoDB and MailHog setup
```

## Configuration

See `.env.example` for all configuration options. Key settings:

- **SMTP**: Configure email sending via Nodemailer
- **Twilio**: Set up SMS via Twilio API
- **VAPID**: Generate keys for WebPush notifications
- **JWT**: Set secret for authentication
- **Rate Limiting**: Configure request limits

## Testing

For testing email locally, use MailHog (included in docker-compose):
- SMTP: `localhost:1025`
- Web UI: `http://localhost:8025`

For Twilio, use the sandbox number for testing.

## License

ISC







