@echo off
chcp 65001 >nul 2>&1
title LLANA Financeiro

:: Navegar para a pasta do script
cd /d "%~dp0"

:: Verificar se foi instalado
if not exist "backend\node_modules" (
    echo.
    echo  ✗ Sistema não instalado ainda!
    echo  Por favor execute primeiro o setup.bat
    echo.
    pause
    exit /b 1
)

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   LLANA Sistema Financeiro           ║
echo  ║   Iniciando...                       ║
echo  ╚══════════════════════════════════════╝
echo.
echo  Abrindo servidor e interface...
echo  NÃO feche as janelas que vão abrir!
echo.

:: Iniciar backend
start "LLANA - Servidor" cmd /k "cd /d "%~dp0backend" && echo Servidor LLANA rodando... && node src/app.js"

:: Aguardar backend iniciar
timeout /t 4 /nobreak >nul

:: Iniciar frontend
start "LLANA - Interface" cmd /k "cd /d "%~dp0frontend" && echo Interface LLANA rodando... && npm run dev"

:: Aguardar frontend iniciar
timeout /t 5 /nobreak >nul

:: Abrir navegador
echo  Abrindo navegador...
start http://localhost:5173

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   Sistema rodando!                   ║
echo  ║                                      ║
echo  ║   Endereço: http://localhost:5173    ║
echo  ║   Login:    admin@llana.com.br       ║
echo  ║   Senha:    admin123                 ║
echo  ║                                      ║
echo  ║   Para fechar: feche as 2 janelas    ║
echo  ║   pretas que estão abertas           ║
echo  ╚══════════════════════════════════════╝
echo.
pause
