# Katastrophenschutz Führungsstab - Stabs-Dashboard (DV 100)

This is a dashboard application for disaster management and real-time telemetry monitoring.

## Installation

First, clone the repository to your local machine:

```bash
git clone https://github.com/Sylasletsplay/Dashboard_FES.git
cd Dashboard_FES
```

## Getting Started

To get the frontend and backend running on your machine, simply execute one of the provided startup scripts. These scripts will automatically set up a Python virtual environment, install the necessary backend and frontend dependencies, build the frontend, and start the application.

### Windows
Double-click `run.bat` or run it from the command line:
```cmd
run.bat
```
Alternatively, you can run the PowerShell script:
```powershell
.\run.ps1
```

### Development Mode
If you want to run the application in development mode with hot-reloading for both the frontend and backend, use:
```cmd
run_dev.bat
```

Once started, the dashboard will be automatically opened in your default web browser at `http://127.0.0.1:8000` (or `http://localhost:5173` in development mode).
