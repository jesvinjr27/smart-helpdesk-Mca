@echo off
title Smart Help Desk - Backend API & Swagger Docs
echo ========================================================
echo   Starting Smart Help Desk FastAPI Backend Server...
echo ========================================================
echo.
echo   Swagger UI Docs: http://127.0.0.1:8000/docs
echo   ReDoc UI:        http://127.0.0.1:8000/redoc
echo   OpenAPI JSON:    http://127.0.0.1:8000/openapi.json
echo.
echo   Demo Login Password: Password123!
echo   Demo Accounts:
echo     - SysAdmin:   sysadmin@smarthelpdesk.local
echo     - Org Admin:  admin@apex.com
echo     - Team Lead:  lead.it@apex.com
echo     - Agent:      agent.john@apex.com
echo     - Requester:  user.alice@apex.com
echo.
echo ========================================================
echo.

.\.venv\Scripts\uvicorn.exe backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause
