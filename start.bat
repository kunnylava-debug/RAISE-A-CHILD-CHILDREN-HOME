@echo off
title RAISE A CHILD CHILDREN HOME - Server & Client Launcher
echo ========================================================
echo   RAISE A CHILD CHILDREN HOME PORTAL
echo   Starting Backend API (Port 5000) and Web App...
echo ========================================================
echo.

cd /d "%~dp0\server"
start "Hostel Backend & Web Server (Port 5000)" cmd /k "node src/server.js"

timeout /t 2 /nobreak >nul

echo Server is online!
echo Opening website in default web browser...
start http://localhost:5000

echo.
echo Application is running at:
echo   Main Portal: http://localhost:5000
echo   API Health:  http://localhost:5000/api/health
echo.
echo Default Admin Credentials:
echo   Username: admin
echo   Password: admin123
echo.
pause
