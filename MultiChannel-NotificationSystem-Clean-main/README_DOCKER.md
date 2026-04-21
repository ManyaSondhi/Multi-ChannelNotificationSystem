# Docker Setup - Quick Start Guide

## Prerequisites
- Docker Desktop installed and running
- Docker Compose installed

## Quick Start

### 1. Create .env file
Copy the example environment file:
```bash
cp .dockerenv.example .env
```

Edit `.env` and add your actual configuration values (Twilio, Email, etc.)

### 2. Start all services
```bash
docker-compose up -d
```

### 3. Seed the database (optional)
```bash
docker-compose exec server node scripts/seed.js
```

### 4. Check services
```bash
# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Test API
curl http://localhost:5000/health
```

## Services

- **MongoDB**: `mongodb://localhost:27017/notificationsystem`
- **API Server**: `http://localhost:5000`
- **MailHog UI**: `http://localhost:8025` (for testing emails)

## Stop Services

```bash
docker-compose down
```

## Reset Everything (⚠️ Deletes data)

```bash
docker-compose down -v
docker-compose up -d --build
```

## Common Issues

### MongoDB connection failed
- Wait a few seconds for MongoDB to start
- Check logs: `docker-compose logs mongodb`
- Verify MongoDB is healthy: `docker-compose ps`

### Server won't start
- Check logs: `docker-compose logs server`
- Verify MongoDB is running: `docker-compose ps mongodb`
- Check .env file has correct MONGODB_URI

### Port already in use
- Change ports in docker-compose.yml
- Or stop the service using the port

For detailed instructions, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)

