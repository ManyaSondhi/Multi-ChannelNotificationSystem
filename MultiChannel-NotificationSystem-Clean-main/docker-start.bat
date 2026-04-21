@echo off
REM Docker Start Script for Notification System (Windows)

echo 🚀 Starting Notification System with Docker...

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from example...
    if exist .dockerenv.example (
        copy .dockerenv.example .env
        echo ✅ Created .env file from .dockerenv.example
        echo ⚠️  Please update .env with your actual configuration before continuing
        pause
        exit /b 1
    ) else (
        echo ❌ .dockerenv.example not found. Please create .env file manually.
        pause
        exit /b 1
    )
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Start services
echo 📦 Starting Docker containers...
docker-compose up -d

REM Wait for MongoDB to be healthy
echo ⏳ Waiting for MongoDB to be ready...
timeout /t 10 /nobreak >nul

REM Wait for server to be healthy
echo ⏳ Waiting for server to be ready...
timeout /t 10 /nobreak >nul

REM Check if server is responding
:check_server
curl -f http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo ⏳ Server is starting...
    timeout /t 5 /nobreak >nul
    goto check_server
)

echo ✅ Server is ready

REM Seed database (optional)
set /p seed="Do you want to seed the database? (y/n): "
if /i "%seed%"=="y" (
    echo 🌱 Seeding database...
    docker-compose exec server node scripts/seed.js
)

echo.
echo ✅ Notification System is running!
echo.
echo 📍 Services:
echo    - API Server: http://localhost:5000
echo    - MongoDB: mongodb://localhost:27017/notificationsystem
echo    - MailHog UI: http://localhost:8025
echo.
echo 📊 View logs: docker-compose logs -f
echo 🛑 Stop services: docker-compose down
echo.
pause

