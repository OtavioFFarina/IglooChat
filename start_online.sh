#!/usr/bin/env bash

# ==============================================================================
# Concord — Iniciar Servidor e Túnel Público HTTPS para Amigos
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "🚀  Iniciando Concord (Backend + Frontend + Túnel HTTPS)..."
echo "=========================================================="

# 1. Matar instâncias anteriores se houver
pkill -f "node server/index.js" 2>/dev/null || true
pkill -f "cloudflared tunnel --url http://localhost:3001" 2>/dev/null || true

sleep 1

# 2. Iniciar Servidor Node.js
echo "📦 Iniciando Servidor Concord na porta 3001..."
node server/index.js > /tmp/concord_server.log 2>&1 &
SERVER_PID=$!

sleep 2

# 3. Iniciar Túnel Cloudflare (HTTPS Seguro para WebRTC / Câmera / Microfone)
echo "🌐 Conectando à Cloudflare Edge (Criando link público seguro)..."
cloudflared tunnel --url http://localhost:3001 > /tmp/concord_tunnel.log 2>&1 &
TUNNEL_PID=$!

# 4. Aguardar geração do link
echo "⏳ Aguardando URL pública..."
URL=""
for i in {1..30}; do
  URL=$(grep -o 'https://[-a-zA-Z0-9]*\.trycloudflare\.com' /tmp/concord_tunnel.log 2>/dev/null | head -n 1 || true)
  if [ -n "$URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$URL" ]; then
  echo "⚠️  Não foi possível detectar a URL automaticamente em 30s."
  echo "Verifique os logs em /tmp/concord_tunnel.log"
else
  echo ""
  echo "=========================================================="
  echo "🎉 CONCORD ESTÁ ONLINE NA REDE!"
  echo "=========================================================="
  echo "🔗 LINK PÚBLICO PARA SEU AMIGO ACESSAR:"
  echo "   $URL"
  echo "=========================================================="
  echo "💡 O seu amigo pode abrir este link no navegador (Chrome, Firefox, Edge, Celular),"
  echo "   criar uma conta e conectar na call com você imediatamente!"
  echo ""
  echo "Pressione [Ctrl + C] para encerrar o servidor e o túnel."
fi

# Cleanup on exit
trap "kill $SERVER_PID $TUNNEL_PID 2>/dev/null || true; echo ''; echo '🛑 Concord finalizado.'; exit 0" INT TERM

wait $SERVER_PID
