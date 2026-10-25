@echo off
setlocal
cd /d "%~dp0.."
echo Close this project's running Vite server with Ctrl+C before continuing.
node -e "const [major,minor]=process.versions.node.split('.').map(Number); if(major<22 || (major===22 && minor<12)){console.error('Node.js 22.12 or newer is required.');process.exit(1)}"
if errorlevel 1 exit /b 1
call npm.cmd ci
if errorlevel 1 (
  echo Installation failed. Do not start Vite yet. Close the project's Node processes and retry.
  exit /b 1
)
node -e "const fs=require('node:fs'),path=require('node:path');require.resolve('firebase/app');require.resolve('firebase/auth');fs.accessSync(path.join(path.dirname(require.resolve('tailwindcss/package.json')),'index.css'));console.log('Firebase and Tailwind files verified.');"
if errorlevel 1 exit /b 1
call npm.cmd run build
if errorlevel 1 exit /b 1
echo Setup verified. Start the site with: npm.cmd run dev
endlocal
