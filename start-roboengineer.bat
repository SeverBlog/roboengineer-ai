@echo off
chcp 65001 >nul
title RoboEngineer AI
cd /d "%~dp0"
echo.
echo ========================================
echo   RoboEngineer AI V1.0
echo ========================================
echo.
if not exist "node_modules" (
  echo First run: installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo Installation failed. Check the network and try again.
    pause
    exit /b 1
  )
)
echo Starting local website...
echo Open http://localhost:5173 in your browser.
echo Press Ctrl+C to stop.
echo.
call npx vite
pause
