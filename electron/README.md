# IglooChat Desktop App (Electron)

Este aplicativo desktop foi criado para resolver a limitação dos navegadores web convencionais, que não conseguem capturar o áudio do sistema operacional como um todo (ex: aplicativo do Spotify baixado, jogos e som geral do computador) durante a transmissão de tela.

## Principais Recursos Nativos:
1. **Transmissão de Tela com Áudio do Sistema**:
   - Usa a API nativa do Electron (`desktopCapturer` + `session.setDisplayMediaRequestHandler` com `audio: 'loopback'`).
   - Permite compartilhar a tela inteira com o som do Spotify, reprodutores locais e jogos tocando diretamente na chamada para todos os amigos ouvirem.
2. **Integração WebRTC Direta**:
   - Conecta-se à API de áudio/vídeo WebRTC do IglooChat com supressão de ruído DSP ativa e servidores TURN de baixa latência.

## Como Executar em Modo de Desenvolvimento:

1. Instalar as dependências do Electron (apenas na primeira vez):
```bash
cd electron
npm install
```

2. Executar o aplicativo desktop:
```bash
npm start
```
*Por padrão ele conectará em `http://localhost:3001` ou na URL definida na variável `IGLOOCHAT_URL` (ex: link do Cloudflare Tunnel).*

## Como Gerar o Instalador (.exe, .AppImage ou .deb):
```bash
npm run dist
```
