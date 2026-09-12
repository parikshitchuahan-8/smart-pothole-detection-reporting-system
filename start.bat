@echo off
title Smart Pothole Detection and Reporting System
echo ========================================================
echo   Starting Smart Pothole Detection & Reporting System
echo ========================================================
echo.

echo [1/3] Starting AI Pothole Detection Service (Port 5001)...
start "AI Pothole Service (Port 5001)" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe ai\server.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Spring Boot REST Backend (Port 8080)...
start "Backend API (Port 8080)" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend React Dashboard (Port 5174)...
start "Frontend Dashboard" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services launched!
echo Open your browser at: http://localhost:5174/
echo.
pause
