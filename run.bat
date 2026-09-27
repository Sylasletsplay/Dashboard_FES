@echo off
setlocal

echo ===================================================================
echo     KATASTROPHENSCHUTZ FUEHRUNGSSTAB - STABS-DASHBOARD (DV 100)
echo ===================================================================
echo.

cd /d "%~dp0"

REM 1. Check Python virtual environment
if not exist "backend\venv" (
    echo [1/2] Erstelle Python Virtual Environment...
    python -m venv backend\venv
    call backend\venv\Scripts\activate.bat
    echo Installiere Python-Abhaengigkeiten...
    python -m pip install -q -r backend\requirements.txt
)

REM 2. Check Frontend dependencies
if not exist "frontend\node_modules" (
    echo [2/2] Installiere Frontend-Abhaengigkeiten...
    pushd frontend
    call npm install
    popd
)

echo.
echo ===================================================================
echo   Starte Dashboard im Entwicklungsmodus (Hot-Reload)...
echo ===================================================================
echo.

start "KatS Backend (:8000)" cmd /k "backend\venv\Scripts\activate.bat && python backend\main.py"
start "KatS Frontend (:5173)" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173
