const { app, BrowserWindow, ipcMain, desktopCapturer, session } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

let mainWindow = null;
let serverProcess = null;

// Enable WebRTC PipeWire Capturer for modern Linux (Wayland & X11)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer');
}

/**
 * Checks if a given HTTP/HTTPS URL is accessible
 */
function isUrlAlive(urlStr, timeoutMs = 800) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname || '/',
          method: 'GET',
          timeout: timeoutMs
        },
        (res) => {
          resolve(true);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

/**
 * Polls a URL until it becomes available or times out
 */
async function waitForServer(urlStr, maxRetries = 25, delayMs = 250) {
  for (let i = 0; i < maxRetries; i++) {
    const alive = await isUrlAlive(urlStr);
    if (alive) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

/**
 * Ensures a server instance is available to serve the application
 */
async function ensureServerRunning() {
  // 1. If explicit CONCORD_URL is provided, use it directly
  if (process.env.CONCORD_URL) {
    console.log(`[Electron] Usando CONCORD_URL customizada: ${process.env.CONCORD_URL}`);
    return process.env.CONCORD_URL;
  }

  // 2. Check if Vite dev server is running on port 5173
  if (await isUrlAlive('http://localhost:5173')) {
    console.log('[Electron] Conectado ao Vite Dev Server em http://localhost:5173');
    return 'http://localhost:5173';
  }

  // 3. Check if server is already running on port 3001
  if (await isUrlAlive('http://localhost:3001')) {
    console.log('[Electron] Conectado ao Servidor Concord já ativo em http://localhost:3001');
    return 'http://localhost:3001';
  }

  // 4. Ensure client is built (client/dist/index.html exists)
  const clientDistIndex = path.join(__dirname, '..', 'client', 'dist', 'index.html');
  if (!fs.existsSync(clientDistIndex)) {
    console.log('[Electron] Build do cliente não encontrado. Gerando build...');
    try {
      execSync('npm run build', {
        cwd: path.join(__dirname, '..', 'client'),
        stdio: 'inherit'
      });
    } catch (err) {
      console.error('[Electron] Falha ao compilar o cliente:', err.message);
    }
  }

  // 5. Spawn backend server automatically
  console.log('[Electron] Servidor não detectado. Iniciando servidor Concord automaticamente...');
  const rootDir = path.join(__dirname, '..');
  serverProcess = spawn('node', ['server/index.js'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, PORT: '3001' }
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron] Erro ao iniciar servidor backend:', err);
  });

  const isReady = await waitForServer('http://localhost:3001');
  if (isReady) {
    console.log('[Electron] Servidor Concord pronto na porta 3001!');
  } else {
    console.warn('[Electron] O servidor demorou a responder, prosseguindo com a tentativa de conexão...');
  }

  return 'http://localhost:3001';
}

function getLoadingHtml() {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Concord</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background-color: #1e1f22;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            user-select: none;
            overflow: hidden;
          }
          .spinner {
            width: 44px;
            height: 44px;
            border: 4px solid #2b2d31;
            border-top: 4px solid #5865f2;
            border-radius: 50%;
            animation: spin 0.75s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h2 {
            font-size: 17px;
            font-weight: 600;
            color: #f2f3f5;
            margin-bottom: 6px;
            letter-spacing: -0.2px;
          }
          p {
            font-size: 13px;
            color: #949ba4;
          }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h2>Iniciando Concord Desktop...</h2>
        <p>Conectando ao serviço e preparando chamadas com áudio do sistema</p>
      </body>
    </html>
  `)}`;
}

function getErrorHtml(targetUrl, errorDescription) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Concord - Falha de Conexão</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background-color: #1e1f22;
            color: #dbdee1;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            padding: 24px;
            user-select: none;
          }
          .card {
            background: #2b2d31;
            border: 1px solid #35373c;
            border-radius: 12px;
            max-width: 480px;
            width: 100%;
            padding: 32px;
            text-align: center;
            box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          }
          .icon {
            font-size: 44px;
            margin-bottom: 16px;
          }
          h2 {
            font-size: 20px;
            font-weight: 700;
            color: #f2f3f5;
            margin-bottom: 12px;
          }
          p {
            font-size: 14px;
            color: #949ba4;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .url-box {
            background: #1e1f22;
            padding: 10px 14px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            color: #5865f2;
            word-break: break-all;
            margin-bottom: 24px;
            border: 1px solid #232428;
          }
          .btn {
            background: #5865f2;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.15s ease;
          }
          .btn:hover {
            background: #4752c4;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🔌</div>
          <h2>Não foi possível conectar ao Concord</h2>
          <p>O servidor não respondeu (${errorDescription || 'conexão indisponível'}).</p>
          <div class="url-box">${targetUrl}</div>
          <button class="btn" onclick="window.location.href='${targetUrl}'">Tentar Novamente</button>
        </div>
      </body>
    </html>
  `)}`;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: '#1e1f22',
    title: 'Concord',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false
    }
  });

  // Mostra tela de splash enquanto verifica/inicia o servidor
  mainWindow.loadURL(getLoadingHtml());

  // Enable full system audio capture for screen sharing
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      if (sources && sources.length > 0) {
        callback({
          video: sources[0],
          audio: 'loopback' // Habilita captura de áudio nativo do sistema
        });
      } else {
        callback({});
      }
    }).catch(err => {
      console.error('[Electron] Erro ao capturar fontes de desktop:', err);
      callback({});
    });
  });

  // Handle connection errors gracefully
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL && validatedURL.startsWith('http')) {
      console.error(`[Electron] Falha ao carregar ${validatedURL}: ${errorDescription} (${errorCode})`);
      mainWindow.loadURL(getErrorHtml(validatedURL, errorDescription));
    }
  });

  const appUrl = await ensureServerRunning();
  mainWindow.loadURL(appUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for desktopCapturer
ipcMain.handle('desktop-capturer-get-sources', async (event, opts) => {
  try {
    const sources = await desktopCapturer.getSources(opts || { types: ['screen', 'window'], fetchWindowIcons: true });
    return (sources || []).map(s => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail ? s.thumbnail.toDataURL() : ''
    }));
  } catch (err) {
    console.error('[Electron] desktop-capturer-get-sources error:', err);
    return [];
  }
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// Finalizar processo do servidor iniciado pelo Electron ao fechar o app
function cleanUp() {
  if (serverProcess) {
    console.log('[Electron] Finalizando servidor Concord backend iniciado pelo desktop...');
    try {
      serverProcess.kill('SIGTERM');
    } catch (e) {}
    serverProcess = null;
  }
}

app.on('before-quit', cleanUp);
app.on('will-quit', cleanUp);
process.on('exit', cleanUp);
process.on('SIGINT', () => { cleanUp(); process.exit(0); });
process.on('SIGTERM', () => { cleanUp(); process.exit(0); });

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  cleanUp();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
