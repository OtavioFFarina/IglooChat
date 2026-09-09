# IglooChat — Design System & Tokens

## 1. Tokens de Cores (Paleta Discord Oficial)
```css
:root {
  /* Planos de Fundo Estruturais */
  --bg-primary: #313338;       /* Fundo principal do chat e palco de vídeo */
  --bg-secondary: #2b2d31;     /* Barra lateral de canais e lista de DMs */
  --bg-secondary-alt: #232428; /* Painel do usuário e cartões de voz */
  --bg-tertiary: #1e1f22;      /* Barra vertical de servidores à esquerda */
  --bg-hover: #35373c;         /* Hover de canais e mensagens */
  --bg-modifier-active: #404249; /* Canal ou item ativo */
  --bg-input: #383a40;         /* Campo de texto de mensagens e inputs */

  /* Cores de Destaque e Marca */
  --brand: #5865F2;            /* Discord Blurple clássico */
  --brand-hover: #4752C4;
  --brand-active: #3C45A5;

  /* Estados de Presença e Alertas */
  --status-online: #23A55A;    /* Verde para online e borda de voz ativa */
  --status-idle: #F0B232;      /* Âmbar / ausente */
  --status-dnd: #F23F43;       /* Vermelho / não perturbar / desconectar */
  --status-live: #F23F43;      /* Badge "AO VIVO" */
  --status-offline: #80848E;

  /* Hierarquia Tipográfica */
  --text-normal: #DBDEE1;      /* Texto de leitura regular */
  --text-muted: #949BA4;       /* Metadados, descrições, canais inativos */
  --text-header: #F2F3F5;      /* Títulos de canais, cabeçalhos, botões principais */
  --text-link: #00A8FC;        /* Links interativos */
}
```

## 2. Tipografia e Escala
- **Família Tipográfica:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Código / Metadados:** `ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "JetBrains Mono", monospace`

## 3. Microinterações Canônicas do Discord
- **Pills de Navegação de Servidor:**
  - O indicador branco à esquerda do ícone do servidor tem altura 0px em repouso, expande para 8px no hover e 40px quando o servidor está selecionado.
  - O ícone do servidor transiciona suavemente de círculo (`border-radius: 50%`) para squircle (`border-radius: 16px`) no hover/active.
- **Detecção de Voz (VAD Green Ring):**
  - Quando o usuário fala na chamada, seu avatar recebe `box-shadow: 0 0 0 2px #23A55A` pulsante.
- **Badge "AO VIVO / LIVE":**
  - Pill vermelha com texto em caixa alta `AO VIVO` exibida em cima do nome do canal e sobre a miniatura da transmissão.
