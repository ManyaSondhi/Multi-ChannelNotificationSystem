# Docker Setup Guide

This guide will help you set up MongoDB and the notification system using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed (comes with Docker Desktop)

## Quick Start

### 1. Create Environment File

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB (will be overridden by Docker)
MONGODB_URI=mongodb://mongodb:27017/notificationsystem

# Server
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@notificationsystem.com

# Web Push
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Base URL (for webhooks)
BASE_URL=http://localhost:5000
```

### 2. Start Services

#### Production Mode
```bash
docker-compose up -d
```

#### Development Mode
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Check Services Status

```bash
docker-compose ps
```

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f mongodb
```

### 5. Seed Database

```bash
# Enter the server container
docker-compose exec server sh

# Run seed script
node scripts/seed.js

# Exit container
exit
```

Or run from host (if you have MongoDB connection configured locally):
```bash
npm run seed
```

## Services

### MongoDB
- **Container**: `notification-mongodb`
- **Port**: `27017`
- **Database**: `notificationsystem`
- **Connection String (from host)**: `mongodb://localhost:27017/notificationsystem`
- **Connection String (from Docker)**: `mongodb://mongodb:27017/notificationsystem`

### Server
- **Container**: `notification-server`
- **Port**: `5000`
- **Health Check**: `http://localhost:5000/health`

### MailHog (Email Testing)
- **Container**: `notification-mailhog`
- **SMTP Port**: `1025`
- **Web UI**: `http://localhost:8025`

## Connecting to MongoDB

### From Host Machine

Use MongoDB Compass or any MongoDB client:
```
mongodb://localhost:27017/notificationsystem
```

### From Docker Containers

Use the service name:
```
mongodb://mongodb:27017/notificationsystem
```

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ This will delete data)
```bash
docker-compose down -v
```

### Restart a Specific Service
```bash
docker-compose restart server
docker-compose restart mongodb
```

### View MongoDB Shell
```bash
docker-compose exec mongodb mongosh notificationsystem
```

### Execute Commands in Server Container
```bash
docker-compose exec server sh
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   docker-compose ps mongodb
   ```

2. **Check MongoDB logs:**
   ```bash
   docker-compose logs mongodb
   ```

3. **Verify MongoDB health:**
   ```bash
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

### Server Connection Issues

1. **Check server logs:**
   ```bash
   docker-compose logs server
   ```

2. **Verify server can reach MongoDB:**
   ```bash
   docker-compose exec server ping mongodb
   ```

3. **Check environment variables:**
   ```bash
   docker-compose exec server env | grep MONGODB
   ```

### Port Already in Use

If port 27017 or 5000 is already in use:

1. **Change ports in docker-compose.yml:**
   ```yaml
   ports:
     - "27018:27017"  # Change host port
   ```

2. **Or stop the service using the port:**
   ```bash
   # Windows
   netstat -ano | findstr :27017
   taskkill /PID <PID> /F
   ```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Development Workflow

1. **Start services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Make code changes** - volumes are mounted, so changes are reflected

3. **View logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f server
   ```

4. **Run migrations/seeds:**
   ```bash
   docker-compose -f docker-compose.dev.yml exec server node scripts/seed.js
   ```

## Production Deployment

1. **Build images:**
   ```bash
   docker-compose build
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Verify health:**
   ```bash
   curl http://localhost:5000/health
   ```

4. **Set up reverse proxy** (nginx, traefik, etc.) if needed

## MongoDB Data Persistence

Data is persisted in Docker volumes:
- `mongodb_data`: Database files
- `mongodb_config`: Configuration files

To backup data:
```bash
docker-compose exec mongodb mongodump --out /data/backup
docker-compose cp mongodb:/data/backup ./backup
```

To restore data:
```bash
docker-compose cp ./backup mongodb:/data/backup
docker-compose exec mongodb mongorestore /data/backup
```

## Network Configuration

All services are on the `notification-network` network, allowing them to communicate using service names.

## Health Checks

- **MongoDB**: Checks if MongoDB is accepting connections
- **Server**: Checks if the `/health` endpoint responds

Services wait for dependencies to be healthy before starting.

