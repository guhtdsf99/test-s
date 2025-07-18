@echo off
echo Starting Phish Aware Academy Development Environment...
echo.

echo Starting Backend (Django)...
start "Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver 8000"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend (React/Vite)...
start "Frontend" cmd /k "npm run dev"

echo.
echo Development servers are starting:
echo - Backend (Django): http://127.0.0.1:8000
echo - Frontend (React): http://localhost:5173
echo.
echo Press any key to exit...
pause > nul