@echo off
echo Starte Katastrophenschutz Dashboard im Entwicklungsmodus (Hot-Reload)...
cd /d "%~dp0"

start "KatS Backend (:8000)" cmd /k "backend\venv\Scripts\activate.bat && python backend\main.py"
start "KatS Frontend (:5173)" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173
