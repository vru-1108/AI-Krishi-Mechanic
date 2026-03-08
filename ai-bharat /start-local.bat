@echo off
echo.
echo 🚜 AI Krishi Mechanic - Local Development Startup
echo ==================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Check AWS credentials
where aws >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ AWS CLI found
    aws sts get-caller-identity >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ AWS credentials configured
    ) else (
        echo ❌ AWS credentials not configured. Run 'aws configure' first.
        pause
        exit /b 1
    )
) else (
    echo ⚠️  AWS CLI not found. Make sure AWS credentials are configured.
)

echo.
echo 📦 Installing dependencies...
echo.

REM Install backend dependencies
if not exist "local-server\node_modules" (
    echo Installing backend dependencies...
    cd local-server
    call npm install
    cd ..
)

REM Install frontend dependencies
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo.
echo ✅ Dependencies installed
echo.
echo 🚀 Starting servers...
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend in new window
start "AI Krishi Backend" cmd /k "cd local-server && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
npm run dev

pause
