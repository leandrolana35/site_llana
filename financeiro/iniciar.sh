#!/bin/bash
echo "========================================"
echo "  LLANA Sistema Financeiro"
echo "========================================"
echo "Iniciando servidores..."
echo

# Backend em background
cd "$(dirname "$0")/backend"
node src/app.js &
BACKEND_PID=$!
echo "Backend iniciado (PID $BACKEND_PID)"

sleep 2

# Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend iniciado (PID $FRONTEND_PID)"

sleep 3

echo
echo "========================================"
echo "  Sistema rodando!"
echo "  Acesse: http://localhost:5173"
echo "  Login:  admin@llana.com.br"
echo "  Senha:  admin123"
echo "========================================"
echo
echo "Pressione Ctrl+C para parar."

# Aguarda
wait
