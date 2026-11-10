const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

let currentQR = null;
let botStatus = 'Iniciando conexión...';

const authFolder = path.join(__dirname, 'auth_info_baileys');
if (!fs.existsSync(authFolder)) {
  fs.mkdirSync(authFolder, { recursive: true });
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = await QRCode.toDataURL(qr);
      botStatus = 'Esperando escaneo de código QR';
      console.log('⚡ Nuevo código QR generado.');
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      botStatus = 'Desconectado. Reconectando...';
      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        botStatus = 'Sesión cerrada. Escanea de nuevo.';
      }
    } else if (connection === 'open') {
      currentQR = null;
      botStatus = '¡Conectado exitosamente!';
      console.log('✅ Bot conectado a WhatsApp correctamente');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      '';

    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(from, { text: '¡Pong! 🏓 Bot activo en Railway.' });
    }
  });
}

connectToWhatsApp();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="5">
      <title>Conectar WhatsApp</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #0b141a;
          color: #e9edef;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background: #111b21;
          padding: 2.5rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          max-width: 420px;
          width: 90%;
        }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #00a884; }
        p { color: #8696a0; font-size: 0.95rem; margin-bottom: 1.5rem; }
        .qr-box {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          display: inline-block;
          margin-bottom: 1.5rem;
        }
        img { width: 250px; height: 250px; display: block; }
        .status {
          font-weight: bold;
          padding: 0.6rem 1rem;
          border-radius: 6px;
          background: #202c33;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Vincular WhatsApp</h1>
        <p>Abre WhatsApp en tu teléfono > Dispositivos vinculados > Vincular un dispositivo.</p>
        <div class="qr-box">
          ${
            currentQR
              ? `<img src="${currentQR}" alt="Código QR WhatsApp" />`
              : `<div style="width:250px;height:250px;display:flex;align-items:center;justify-content:center;color:#333;font-size:0.9rem;"><b>${botStatus}</b></div>`
          }
        </div>
        <div>
          <span class="status">${botStatus}</span>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en el puerto ${PORT}`);
});
