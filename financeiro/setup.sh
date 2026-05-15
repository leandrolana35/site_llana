#!/bin/bash
echo "========================================"
echo "  LLANA Sistema Financeiro - Setup"
echo "========================================"
echo

echo "[1/4] Instalando dependencias do backend..."
cd backend
npm install || { echo "ERRO no backend"; exit 1; }

echo
echo "[2/4] Configurando banco de dados SQLite..."
cp .env.example .env
npm run db:push || { echo "ERRO ao criar banco"; exit 1; }

echo
echo "[3/4] Populando dados iniciais..."
npm run db:seed || { echo "ERRO no seed"; exit 1; }

echo
echo "[4/4] Instalando dependencias do frontend..."
cd ../frontend
npm install || { echo "ERRO no frontend"; exit 1; }

echo
echo "========================================"
echo "  Setup concluido!"
echo "  Execute: ./iniciar.sh"
echo "========================================"
