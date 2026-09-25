Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "    KATASTROPHENSCHUTZ FUEHRUNGSSTAB - STABS-DASHBOARD (DV 100)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 1. Check venv
if (-not (Test-Path "backend\venv")) {
    Write-Host "[1/3] Erstelle Python Virtual Environment..." -ForegroundColor Yellow
    python -m venv backend\venv
    & "backend\venv\Scripts\python.exe" -m pip install -q -r backend\requirements.txt
}

# 2. Check frontend build
if (-not (Test-Path "frontend\dist")) {
    Write-Host "[2/3] Erstelle Frontend-Produktions-Build..." -ForegroundColor Yellow
    if (-not (Test-Path "frontend\node_modules")) {
        Push-Location frontend
        npm install
        Pop-Location
    }
    Push-Location frontend
    npm run build
    Pop-Location
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "  DASHBOARD BEREIT!" -ForegroundColor Green
Write-Host "  Oeffne Dashboard unter: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://127.0.0.1:8000"
& "backend\venv\Scripts\python.exe" "backend\main.py"
