@echo off
echo 🚀 Starting EcoSync Nexus Full System...
echo =====================================

echo.
echo 📡 Starting Backend Server...
cd backend
start "EcoSync Backend" cmd /k "node index.js"

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo 🌐 Starting Frontend Development Server...
cd ..
start "EcoSync Frontend" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting!
echo.
echo 📋 Access Points:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3000
echo   - Health:   http://localhost:3000/health
echo.
echo 🎤 Voice Assistant Features:
echo   - Real backend appliance control
echo   - Multilingual support (Hindi, English, Spanish, French, German)
echo   - Respectful AI responses with proper honorifics
echo   - Live device state synchronization
echo.
echo Press any key to close this window...
pause > nul