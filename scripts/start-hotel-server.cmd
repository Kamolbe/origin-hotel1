@echo off
setlocal
cd /d "%~dp0.."
if not exist "backend\.venv\Scripts\python.exe" (
  py -3 -m venv backend\.venv
  if errorlevel 1 goto failed
)
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if errorlevel 1 goto failed
call npm.cmd ci --include=dev
if errorlevel 1 goto failed
call npm.cmd run build
if errorlevel 1 goto failed
backend\.venv\Scripts\python.exe backend\manage.py migrate --noinput
if errorlevel 1 goto failed
echo.
echo Website: http://127.0.0.1:8000
 echo First admin account: backend\.venv\Scripts\python.exe backend\manage.py createsuperuser
backend\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
exit /b %errorlevel%
:failed
echo Setup failed. Read the error above. Do not start the server until setup succeeds.
exit /b 1
