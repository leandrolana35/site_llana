@echo off
echo ========================================
echo   LLANA Sistema Financeiro - Setup
echo ========================================
echo.

echo [1/4] Instalando dependencias do backend...
cd backend
call npm install
if errorlevel 1 (echo ERRO no backend & pause & exit /b 1)

echo.
echo [2/4] Configurando banco de dados...
copy .env.example .env >nul 2>&1
call npm run db:push
if errorlevel 1 (echo ERRO ao criar banco & pause & exit /b 1)

echo.
echo [3/4] Populando dados iniciais...
call npm run db:seed
if errorlevel 1 (echo ERRO no seed & pause & exit /b 1)

echo.
echo [4/4] Instalando dependencias do frontend...
cd ..\frontend
call npm install
if errorlevel 1 (echo ERRO no frontend & pause & exit /b 1)

echo.
echo ========================================
echo   Setup concluido com sucesso!
echo ========================================
echo.
echo   Agora execute: iniciar.bat
echo.
pause
