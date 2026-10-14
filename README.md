# IglooChat 🚀 — Aplicativo de Conversas & Transmissão de Tela em Tempo Real

> **Desenvolvido primariamente para uso pessoal no dia a dia, mas projetado para ser compartilhado com a comunidade e ajudar qualquer pessoa que busque uma plataforma leve, sem fricção e de alta performance para conversas por voz, texto e streaming de tela.**

O **IglooChat** é uma plataforma completa de comunicação em tempo real inspirada na arquitetura, design system e experiência de usuário do **Discord**. O software conta com canais de voz de baixa latência, **compartilhamento de tela em tempo real via WebRTC** (1080p 60fps), criação e gestão de servidores, canais de texto e chamadas privadas (DMs).

---

## 🎮 Funcionalidades Principais

### 1. Compartilhamento de Tela Funcional (WebRTC)
- **Captura em Alta Resolução:** Utiliza a Web API nativa `navigator.mediaDevices.getDisplayMedia` com suporte a 1080p a 60 FPS e captura de áudio do sistema/aba.
- **Badge "AO VIVO / LIVE":** Etiqueta vermelha em tempo real exibida sobre a transmissão e na lista de canais para alertar a comunidade sobre a live ativa.
- **Modos de Visualização:**
  - **Modo Destaque (Theater / Stage Mode):** A transmissão de tela ocupa o palco central com os participantes em miniatura na parte inferior.
  - **Modo Grade (Grid View):** Telas e câmeras distribuídas em blocos simétricos.
  - **Tela Cheia Nativa:** Suporte a Fullscreen (`requestFullscreen`) para visualização de gameplay e código.
- **Tratamento de Encerramento:** Captura o evento nativo `track.onended` quando o usuário clica em "Parar compartilhamento" no navegador, sincronizando o status com todos os participantes instantaneamente.

### 2. Canais de Voz & Chamadas (Calls)
- **Voice Activity Detection (VAD):** Análise de volume em tempo real via `AudioContext` com o **anel verde pulsante** ao redor do avatar do usuário quando ele fala.
- **Controles de Chamada:**
  - Mutar Microfone (`MicOff` com atalho sonoro).
  - Ensurdecer Áudio (`Deafen`).
  - Ligar/Desligar Câmera (`Webcam`).
  - Compartilhar / Parar Tela.
  - Desconectar da Chamada (botão vermelho clássico do Discord).
- **Efeitos Sonoros Sintetizados:** Chimes de conexão, desconexão, mute, unmute e ringtone de chamada gerados proceduralmente via Web Audio API (100% offline, zero dependência de arquivos de áudio externos).
- **Card "Voz Conectada":** Indicador fixo acima do perfil do usuário mostrando a latência RTC (ms), canal atual e atalhos rápidos de tela e desconexão.

### 3. Servidores (Guilds), Canais e Convites
- **Criação de Servidores:** Modal com templates temáticos ("Criar o meu", "Jogos", "Clube Escolar", "Amigos"), upload/escolha de ícone e criação automática dos canais padrões.
- **Sistema de Convites:** Geração de códigos de convite únicos (ex: `igloochat-oficial`, `dev-pair-2026`) e modal para entrar em qualquer servidor existente via código.
- **Canais de Texto (`#`) e Voz (`🔊`):** Organizados em categorias colapsáveis, com indicador de participantes conectados ao vivo logo abaixo do canal de voz correspondente.
- **Lista de Membros:** Barra lateral direita categorizada por status ("DISPONÍVEL", "INDISPONÍVEL"), com popover de perfil ao clicar.

### 4. Chat Privado (DMs) & Amigos
- **Painel de Amigos:** Aba com contadores de amigos online, lista completa e botão de adicionar amigos.
- **Mensagens Diretas 1-a-1:** Histórico em tempo real de mensagens privadas.
- **Chamada Privada Direta:** Inicie uma call de áudio, vídeo e compartilhamento de tela diretamente de uma conversa privada com ringing modal interativo.

### 5. Chat com Markdown, Emojis e Anexos
- **Markdown Completo:** Suporte a negrito (`**texto**`), itálico (`*texto*`), código inline (`` `código` ``) e blocos de código.
- **Upload de Imagens e Arquivos:** Suporte a envio de imagens com lightbox de zoom e downloads de anexos via endpoint `/api/upload`.
- **Reações com Emojis:** Barra flutuante no hover para adicionar reações rápidas (🔥, 🚀, ❤️, 👍, 😂, 💯) e contadores dinâmicos.
- **Agrupamento de Mensagens:** Mensagens consecutivas do mesmo autor em um intervalo de 5 minutos são agrupadas sob o mesmo avatar, reduzindo o ruído visual.

### 6. Alternador Rápido de Usuários (Multi-Window Testing)
- No canto inferior esquerdo e nas configurações, você pode alternar entre os usuários de teste com 1 clique (**Otávio**, **AlexDev**, **BiaGamer**, **CarlosUI**) para testar o WebRTC e as trocas de mensagens na mesma máquina ou em abas anônimas separadas.

---

## 🛠️ Arquitetura Técnica

```
IglooChatProject/
├── client/                     # Frontend (React 18, TypeScript, Tailwind CSS, Lucide Icons)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ServerRail.tsx           # Barra de servidores à esquerda (72px)
│   │   │   ├── Sidebar.tsx              # Canais do servidor ou lista de DMs (240px)
│   │   │   ├── VoiceStage.tsx           # Palco de chamadas e compartilhamento de tela
│   │   │   ├── ChatArea.tsx             # Área de mensagens e cabeçalho
│   │   │   ├── MessageInput.tsx         # Campo de entrada de texto com upload e emojis
│   │   │   ├── MemberList.tsx           # Lista lateral de membros do servidor
│   │   │   ├── DirectMessagesView.tsx   # Painel de amigos e conversas diretas
│   │   │   ├── UserControls.tsx         # Painel inferior de controle (mic, deafen, config)
│   │   │   ├── VoiceConnectionCard.tsx  # Card "Voz Conectada"
│   │   │   ├── CreateServerModal.tsx    # Modal de criação de servidor
│   │   │   ├── JoinServerModal.tsx      # Modal de entrada por código de convite
│   │   │   ├── CreateChannelModal.tsx   # Modal de criação de canais de texto e voz
│   │   │   ├── UserSettingsModal.tsx    # Configurações de perfil e teste de mic/câmera/tela
│   │   │   └── IncomingCallModal.tsx    # Modal de recebimento de chamada privada
│   │   ├── context/
│   │   │   └── IglooChatContext.tsx       # Estado global reativo da aplicação
│   │   ├── services/
│   │   │   ├── socket.ts                # Conexão Gateway Socket.IO
│   │   │   ├── webrtc.ts                # Gerenciador de WebRTC, telas e VAD
│   │   │   └── audioEffects.ts          # Síntese sonora via Web Audio API
│   │   └── types/
│   │       └── index.ts                 # Contratos e tipagens TypeScript
├── server/                     # Backend (Node.js, Express, Socket.IO, JSON Persistence)
│   ├── routes/
│   │   └── api.js                       # REST API (usuários, servidores, mensagens, uploads)
│   ├── socket/
│   │   └── index.js                     # Gateway em tempo real e sinalização WebRTC
│   ├── data/
│   │   └── igloochat.json                 # Banco de dados persistente com auto-seed
│   ├── uploads/                         # Armazenamento de anexos enviados no chat
│   ├── db.js                            # Camada de persistência e operações de dados
│   └── index.js                         # Ponto de entrada do servidor HTTP e Socket.IO
├── PRODUCT.md                  # Especificação funcional e personas do IglooChat
├── DESIGN.md                   # Tokens de cores oficiais do Discord e regras visuais
└── package.json                # Orquestrador com scripts concurrentes
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js**: v18+ ou superior
- **NPM**: v9+ ou superior

### 1. Iniciar em Modo de Desenvolvimento (Hot Reload)
No diretório raiz `/home/ofx/ProjetosDev/IglooChatProject`:
```bash
npm run dev
```
Isso iniciará concorrentemente:
- **Servidor Backend (Express + Socket.IO + WebRTC Gateway):** `http://localhost:3001`
- **Frontend Client (Vite + React + HMR):** `http://localhost:5173`

### 2. Iniciar em Modo de Produção Unificado
Se preferir rodar tudo em uma única porta:
```bash
npm run build   # Compila os assets do React para client/dist
npm start       # Inicia o servidor Express servindo a API e o frontend em http://localhost:3001
```
Basta abrir seu navegador em: **`http://localhost:3001`**

---

## 🧪 Roteiro de Teste do Compartilhamento de Tela & Voz

1. **Abra o IglooChat:** Acesse `http://localhost:3001` no seu navegador.
2. **Entre em um Canal de Voz:**
   - No menu lateral do servidor `IglooChat Hub Oficial`, clique em `🔊 Sala de Reunião & Tela`.
   - Você ouvirá o som característico de conexão e o card verde **"Voz Conectada"** surgirá.
3. **Compartilhe sua Tela:**
   - No palco de chamada, clique no botão azul **"Compartilhar Tela"**.
   - O seletor nativo do navegador se abrirá permitindo escolher Tela Inteira, Janela ou Aba.
   - Sua tela será transmitida ao vivo em alta definição com a tag vermelha **"AO VIVO"**!
4. **Teste de Áudio e Fala (VAD):**
   - Fale no microfone e observe o anel verde pulsante acender ao redor do seu avatar.
5. **Teste Multi-Usuário (Duas Janelas):**
   - Abra uma janela anônima e acesse `http://localhost:3001`.
   - Na janela anônima, use o botão no rodapé do rail esquerdo para alternar o usuário para `AlexDev`.
   - Entre no mesmo canal de voz ou inicie uma chamada privada entre `Otávio` e `AlexDev`.
   - Ambas as telas e vozes serão transmitidas via WebRTC P2P em tempo real!
