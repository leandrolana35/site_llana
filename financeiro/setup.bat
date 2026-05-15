@echo off
chcp 65001 >nul 2>&1
title LLANA Financeiro - Instalação

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   LLANA Sistema Financeiro           ║
echo  ║   Instalação — aguarde...            ║
echo  ╚══════════════════════════════════════╝
echo.

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo  ✗ Node.js não encontrado!
    echo.
    echo  Por favor instale o Node.js antes de continuar:
    echo  → Acesse: https://nodejs.org
    echo  → Baixe a versão LTS e instale
    echo  → Reinicie o computador e rode este setup novamente
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  ✓ Node.js encontrado: %NODE_VER%
echo.

:: Navegar para a pasta do script
cd /d "%~dp0"

echo  [1/4] Instalando dependências do servidor...
cd backend
call npm install --silent
if errorlevel 1 (
    echo  ✗ Erro ao instalar dependências do servidor
    pause & exit /b 1
)
echo  ✓ Servidor instalado!
echo.

echo  [2/4] Criando banco de dados...
if not exist .env (
    copy .env.example .env >nul
)
call npm run db:push
if errorlevel 1 (
    echo  ✗ Erro ao criar o banco de dados
    pause & exit /b 1
)
echo  ✓ Banco de dados criado!
echo.

echo  [3/4] Carregando dados iniciais...
call npm run db:seed
if errorlevel 1 (
    echo  ✗ Erro ao carregar dados iniciais
    pause & exit /b 1
)
echo  ✓ Dados iniciais carregados!
echo.

echo  [4/4] Instalando dependências da tela...
cd ..\frontend
call npm install --silent
if errorlevel 1 (
    echo  ✗ Erro ao instalar dependências da tela
    pause & exit /b 1
)
echo  ✓ Tela instalada!
echo.

echo  ╔══════════════════════════════════════╗
echo  ║   Instalação concluída com sucesso!  ║
echo  ║                                      ║
echo  ║   Agora clique duas vezes em:        ║
echo  ║   → iniciar.bat                      ║
echo  ╚══════════════════════════════════════╝
echo.
pause
