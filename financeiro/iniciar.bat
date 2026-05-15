@echo off
echo ========================================
echo   LLANA Sistema Financeiro
echo ========================================
echo.
echo Iniciando servidores...
echo.

start "LLANA Backend" cmd /k "cd /d %~dp0backend && node src/app.js"
timeout /t 3 /nobreak >nul
start "LLANA Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 4 /nobreak >nul

echo Abrindo no navegador...
start http://localhost:5173

echo.
echo ========================================
echo   Sistema rodando!
echo   Acesse: http://localhost:5173
echo   Login:  admin@llana.com.br
echo   Senha:  admin123
echo ========================================
echo.
echo Feche as janelas do backend e frontend para parar.
pause
