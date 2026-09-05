# Concord — Product Specification

## 1. Visão do Produto
O **Concord** é uma plataforma de comunicação em tempo real de alta fidelidade visual e funcional inspirada diretamente na arquitetura e experiência de usuário do Discord. Ele foi projetado para oferecer comunicação cristalina com canais de voz, compartilhamento de tela com baixa latência, gestão modular de servidores e canais, além de chats diretos e privados (DMs).

## 2. Público-Alvo e Casos de Uso
- **Desenvolvedores & Equipes de Tecnologia:** Compartilhamento de tela em tempo real para pair programming, debugging colaborativo e reuniões rápidas.
- **Gamers & Comunidades:** Canais de voz permanentes onde usuários entram e saem sem burocracia, com transmissão de gameplay ao vivo ("AO VIVO / LIVE").
- **Grupos de Amigos:** Chat de texto rico com anexos, reações em tempo real, status de presença e chamadas 1-a-1 privadas.

## 3. Pilares Funcionais Obrigatórios
1. **Compartilhamento de Tela Funcional (WebRTC Screen Sharing):**
   - Captura via `navigator.mediaDevices.getDisplayMedia` de tela inteira, janela ou aba.
   - Transmissão em alta resolução (1080p/60fps) com suporte a áudio da tela.
   - Tag Discord "AO VIVO / LIVE" vermelha em tempo real sobre o stream e na lista de canais.
   - Modos de visualização: Grade Dinâmica (Grid View) e Foco/Teatro (Stage Mode) com suporte a tela cheia nativa.
2. **Servidores, Canais e Convites:**
   - Criação de servidores com ícone/avatar customizável e canais padrões predefinidos.
   - Sistema de convite por código único (ex: `concord-alpha-123`) para entrada imediata.
   - Categorias colapsáveis organizando canais de texto (`#`) e canais de voz (`🔊`).
   - Lista dinâmica de canais mostrando os participantes conectados ao vivo sob o canal de voz correspondente.
3. **Canais de Voz e Chamadas Privadas:**
   - Conexão e desconexão de canais com feedback de status visual.
   - VAD (Voice Activity Detection): Detecção de voz em tempo real destacando a borda do avatar em verde pulsante quando o usuário fala.
   - Controles de chamada: Mutar Microfone, Ensurdecer Áudio (Deafen), Ligar Câmera e Compartilhar Tela.
   - Chamadas diretas (DMs): Início de chamada 1-a-1 com tela/áudio a partir da conversa privada.
4. **Chat Privado (DMs) & Chat de Servidor:**
   - Mensagens em tempo real via WebSockets (Socket.IO).
   - Formatação Markdown (negrito, itálico, blocos de código com sintaxe, citações).
   - Suporte a envio de imagens e arquivos anexos.
   - Reações com emojis.
   - Histórico e persistência no banco de dados SQLite.
5. **Presença e Perfis de Usuário:**
   - Status: Disponível (Verde), Ausente (Amarelo), Não Perturbar (Vermelho) e Invisível.
   - Seletor de perfis para facilitar testes locais multi-usuário entre abas ou janelas anônimas.
