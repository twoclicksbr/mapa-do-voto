@echo off

:: Herd
echo Iniciando Herd...
:: herd start >nul 2>&1

:: ─── Site (porta 3000) ───────────────────────────────────────────────────────
echo Verificando porta 3000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo Matando processo %%P na porta 3000...
    taskkill /F /PID %%P >nul 2>&1
    timeout /t 2 /nobreak >nul
)
start "Site" cmd /k "cd /d C:\Herd\mapadovoto\site & npm run dev"

:: ─── Maps (porta 5173) ───────────────────────────────────────────────────────
echo Verificando porta 5173...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo Matando processo %%P na porta 5173...
    taskkill /F /PID %%P >nul 2>&1
    timeout /t 2 /nobreak >nul
)
start "Maps" cmd /k "cd /d C:\Herd\mapadovoto\maps & npm run dev"

echo Pronto.
