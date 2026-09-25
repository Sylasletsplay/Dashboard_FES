@echo off
setlocal

echo ===================================================================
echo     KATASTROPHENSCHUTZ FUEHRUNGSSTAB - STABS-DASHBOARD (DV 100)
echo ===================================================================
echo.

cd /d "%~dp0"

REM 1. Check Python virtual environment
if not exist "backend\venv" (
    echo [1/3] Erstelle Python Virtual Environment...
    python -m venv backend\venv
    call backend\venv\Scripts\activate.bat
    echo [2/3] Installiere Python-Abhaengigkeiten...
    python -m pip install -q -r backend\requirements.txt
) else (
    call backend\venv\Scripts\activate.bat
)

REM 2. Check if frontend build exists
if not exist "frontend\dist" (
    echo [3/3] Erstelle Frontend-Produktions-Build...
    if not exist "frontend\node_modules" (
        pushd frontend
        call npm install
        popd
    )
    pushd frontend
    call npm run build
    popd
)

echo.
echo ===================================================================
echo   DASHBOARD BEREIT!
echo   Oeffne Dashboard unter: http://127.0.0.1:8000
echo ===================================================================
echo.

start http://127.0.0.1:8000
python backend\main.py
