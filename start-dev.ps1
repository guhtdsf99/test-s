Write-Host "Starting Phish Aware Academy Development Environment..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Backend (Django)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python manage.py runserver 8000"

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Starting Frontend (React/Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "Development servers are starting:" -ForegroundColor Green
Write-Host "- Backend (Django): http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "- Frontend (React): http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")