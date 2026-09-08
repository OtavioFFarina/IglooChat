#!/usr/bin/env bash
# ==============================================================================
# Concord — Script de Atualização Contínua em Produção (Zero Downtime)
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "🚀 Iniciando Atualização Contínua do Concord..."
echo "=========================================================="

echo "📥 Puxando últimas alterações do Git..."
git pull origin master

echo "📦 Instalando dependências e compilando Frontend..."
cd client
npm install
npm run build
cd ..

echo "📦 Instalando dependências do Servidor..."
cd server
npm install
cd ..

echo "🔄 Recarregando processo com PM2..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload concord-backend || pm2 start server/index.js --name "concord-backend"
  pm2 save
  echo "✅ PM2 recarregado com sucesso!"
else
  echo "⚠️ PM2 não encontrado globalmente. Se estiver rodando manualmente, reinicie o processo Node."
fi

echo "=========================================================="
echo "🎉 Concord atualizado e operacional!"
echo "=========================================================="
