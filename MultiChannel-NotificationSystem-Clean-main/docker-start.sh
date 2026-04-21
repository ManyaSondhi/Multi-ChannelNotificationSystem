#!/bin/bash

# Docker Start Script for Notification System

echo "🚀 Starting Notification System with Docker..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f .dockerenv.example ]; then
        cp .dockerenv.example .env
        echo "✅ Created .env file from .dockerenv.example"
        echo "⚠️  Please update .env with your actual configuration before continuing"
        exit 1
    else
        echo "❌ .dockerenv.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start services
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for MongoDB to be healthy
echo "⏳ Waiting for MongoDB to be ready..."
timeout=60
counter=0
while ! docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        echo "❌ MongoDB failed to start within $timeout seconds"
        docker-compose logs mongodb
        exit 1
    fi
    echo -n "."
done
echo ""
echo "✅ MongoDB is ready"

# Wait for server to be healthy
echo "⏳ Waiting for server to be ready..."
timeout=60
counter=0
while ! curl -f http://localhost:5000/health > /dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        echo "❌ Server failed to start within $timeout seconds"
        docker-compose logs server
        exit 1
    fi
    echo -n "."
done
echo ""
echo "✅ Server is ready"

# Seed database (optional)
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    docker-compose exec server node scripts/seed.js
fi

echo ""
echo "✅ Notification System is running!"
echo ""
echo "📍 Services:"
echo "   - API Server: http://localhost:5000"
echo "   - MongoDB: mongodb://localhost:27017/notificationsystem"
echo "   - MailHog UI: http://localhost:8025"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"

