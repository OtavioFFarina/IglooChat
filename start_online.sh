#!/usr/bin/env bash

# ==============================================================================
# IglooChat — Iniciar Servidor e Túnel Público HTTPS para Amigos
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "🚀  Iniciando IglooChat (Backend + Frontend + Túnel HTTPS)..."
echo "=========================================================="

# 1. Matar instâncias anteriores se houver
pkill -f "node server/index.js" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true

sleep 1

# Limpar logs anteriores
> /tmp/igloochat_server.log
> /tmp/igloochat_tunnel.log

# 2. Garantir que o frontend compilado existe
if [ ! -f "client/dist/index.html" ]; then
  echo "📦 Compilando Frontend (client/dist) pela primeira vez..."
  (cd client && npm run build)
fi

# 3. Iniciar Servidor Node.js
echo "📦 Iniciando Servidor IglooChat na porta 3001..."
NODE_ENV=production node server/index.js > /tmp/igloochat_server.log 2>&1 &
SERVER_PID=$!

sleep 2

# Verificar se o servidor subiu
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "❌ Falha ao iniciar o servidor Node.js!"
  cat /tmp/igloochat_server.log
  exit 1
fi

# 4. Iniciar Túnel Cloudflare com tentativas e filtro estrito de URL
MAX_ATTEMPTS=3
ATTEMPT=1
URL=""
TUNNEL_PID=""

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "🌐 Conectando à Cloudflare Edge (Tentativa $ATTEMPT/$MAX_ATTEMPTS)..."
  > /tmp/igloochat_tunnel.log
  
  cloudflared tunnel --url http://localhost:3001 > /tmp/igloochat_tunnel.log 2>&1 &
  TUNNEL_PID=$!

  # Aguardar até 25 segundos para a URL ser gerada
  for i in {1..25}; do
    # Verifica se o processo cloudflared morreu prematuramente
    if ! kill -0 $TUNNEL_PID 2>/dev/null; then
      echo "⚠️  Processo cloudflared encerrou inesperadamente."
      break
    fi

    # Filtra estritamente subdomínios válidos do trycloudflare (descartando api.trycloudflare.com)
    URL=$(grep -o 'https://[-a-zA-Z0-9]*\.trycloudflare\.com' /tmp/igloochat_tunnel.log 2>/dev/null | grep -v 'api\.trycloudflare\.com' | head -n 1 || true)
    
    if [ -n "$URL" ]; then
      break 2
    fi
    sleep 1
  done

  # Se chegou aqui sem URL válida, mata o processo e tenta novamente
  kill $TUNNEL_PID 2>/dev/null || true
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -le $MAX_ATTEMPTS ]; then
    echo "🔄 Tentando reconectar o túnel em 2 segundos..."
    sleep 2
  fi
done

if [ -z "$URL" ]; then
  echo ""
  echo "⚠️  Não foi possível gerar a URL pública da Cloudflare."
  echo "------------------- Logs do Túnel -------------------"
  cat /tmp/igloochat_tunnel.log
  echo "-----------------------------------------------------"
  echo "💡 O servidor local continua rodando normalmente em: http://localhost:3001"
else
  echo ""
  echo "=========================================================="
  echo "🎉 IGLOOCHAT ESTÁ ONLINE NA REDE!"
  echo "=========================================================="
  echo "💻 LOCAL (Para você usar no seu computador):"
  echo "   http://localhost:3001"
  echo ""
  echo "🔗 LINK PÚBLICO SEGURO (HTTPS - Para enviar aos amigos):"
  echo "   $URL"
  echo "=========================================================="
  echo "💡 Seus amigos podem abrir este link no navegador (Chrome, Edge, Firefox, Celular),"
  echo "   criar uma conta e conectar na call com voz, vídeo e tela imediatamente!"
  echo ""
  echo "Pressione [Ctrl + C] para encerrar o servidor e o túnel."
fi

# Cleanup on exit
trap "kill $SERVER_PID $TUNNEL_PID 2>/dev/null || true; echo ''; echo '🛑 IglooChat finalizado.'; exit 0" INT TERM

wait $SERVER_PID
