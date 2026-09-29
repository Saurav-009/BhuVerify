@echo off
title BhuVerify — SIH 2026 Intelligent Land Record Digitization
echo =======================================================================
echo          BhuVerify — Team Tesseract (SIH26018)
echo     Intelligent Land Record Digitization and Validation System
echo =======================================================================
echo.

rem GEMINI_API_KEY must be set in Bihar_Land_OCR_Dataset\.env  (locally)
rem or as a Netlify environment variable in production.
rem See .env.example for the required format — never hardcode secrets here.
set ROOT_DIR=%~dp0

echo [*] Starting Python AI & OCR Microservice on port 8000...
start "BhuVerify Python AI Engine (Port 8000)" cmd /k "cd /d %ROOT_DIR%Bihar_Land_OCR_Dataset && python server.py"

echo [*] Launching BhuVerify in your browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo [*] Starting Frontend Server on port 3000...
cd /d "%ROOT_DIR%"
python serve_frontend.py

