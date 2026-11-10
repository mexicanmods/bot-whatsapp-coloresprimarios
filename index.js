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

// Carpeta de persistencia de credenciales
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
      console.log('Conexión cerrada. Reconectando:', shouldReconnect);
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

  // Manejo de mensajes y navegación interactiva
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      '';
    const text = body.trim().toLowerCase();

    console.log(`📩 Mensaje entrante de ${from}: "${body}"`);

    // 1. Menú principal / Ayuda
    if (text === '.menu' || text === '.ayuda' || text === 'menu') {
      const menu = 
`🤖 *MENÚ PRINCIPAL* 🤖

Selecciona una opción escribiendo el número o comando:

1️⃣ Escribe *1* o *.streaming* ➔ Plataformas digitales
2️⃣ Escribe *2* o *.tramites* ➔ Trámites y documentos
3️⃣ Escribe *3* o *.redes* ➔ Seguidores y redes sociales
💳 Escribe *.pago* ➔ Cuentas de depósito y SPEI
👨‍💻 Escribe *.soporte* ➔ Hablar con un asesor

_Envía el número o comando para continuar._`;
      await sock.sendMessage(from, { text: menu });
    }

    // 2. Opción 1: Streaming
    else if (text === '1' || text === '.streaming') {
      const streaming = 
`📺 *CUENTAS DE STREAMING & LICENCIAS* 📺

Precios disponibles:
• Perfiles y cuentas desde $35/mes o $200/año.
• Netflix, Disney+, Max, Prime Video, etc.

👉 *Para solicitar:*
Envía: *"Quiero contratar [nombre del servicio]"* o escribe *.pago* para liquidar tu cuenta.`;
      await sock.sendMessage(from, { text: streaming });
    }

    // 3. Opción 2 o .tramites: Catálogo y requisitos de documentos
    else if (text === '2' || text === '.tramites' || text === '.documentos') {
      const tramites = 
`📄 *TRÁMITES ADMINISTRATIVOS EXPRESS* 📄

Precios de emisión:
• *Actas de nacimiento:* $75
• *CURP certificada:* $10
• *Constancia RFC / SAT:* $75 - $150
• *Recibo CFE:* $50
• *Semanas Cotizadas IMSS:* $75
• *Vigencia de Derechos IMSS/ISSSTE:* $35
• *No Derechohabiencia:* $35
• *Citas Oficiales / Cédulas / Infonavit:* $100

👉 *¿Cómo pedir tu documento?*
Escribe el nombre del documento o manda:
*"Requisitos para [documento]"* (ejemplo: *Requisitos acta*).
O envía directo los datos del titular para iniciar el trámite.`;
      await sock.sendMessage(from, { text: tramites });
    }

    // 4. Opción 3: Redes Sociales
    else if (text === '3' || text === '.redes') {
      const redes = 
`🚀 *SEGUIDORES Y REDES SOCIALES* 🚀

Para Facebook, TikTok, Instagram y YouTube:
• 1 seguidor / interacción: $1
• Paquete 5,000 seguidores: $250
• Paquete 10,000 seguidores: $500

👉 *Para ordenar:*
Envía el enlace público de tu perfil y la cantidad deseada.`;
      await sock.sendMessage(from, { text: redes });
    }

    // 5. Respuestas rápidas de requisitos para documentos
    else if (text.includes('acta')) {
      await sock.sendMessage(from, { 
        text: `📑 *REQUISITOS ACTA DE NACIMIENTO ($75)*\n\nPara tramitarla envía:\n• Nombre completo del titular\n• Fecha y lugar de nacimiento\n• CURP (o nombres de los padres)\n\n_Al enviar los datos, realiza tu pago con *.pago* y manda comprobante._` 
      });
    }

    else if (text.includes('rfc') || text.includes('sat')) {
      await sock.sendMessage(from, { 
        text: `📑 *REQUISITOS RFC / SAT ($75 - $150)*\n\nEnvía tu CURP completa y código postal registrado ante el SAT para emitir tu Constancia de Situación Fiscal.` 
      });
    }

    else if (text.includes('curp')) {
      await sock.sendMessage(from, { 
        text: `📑 *REQUISITOS CURP ($10)*\n\nEnvía el nombre completo, fecha y estado de nacimiento para descargarla en formato oficial certificado.` 
      });
    }

    else if (text.includes('imss') || text.includes('semanas')) {
      await sock.sendMessage(from, { 
        text: `📑 *TRÁMITES IMSS*\n\n• Semanas cotizadas: $75\n• Vigencia / No derechohabiencia: $35\n\nEnvía: NSS (Número de Seguridad Social), CURP y correo electrónico.` 
      });
    }

    // 6. Pagos
    else if (text === '.pago' || text === 'pago') {
      const pago = 
`💳 *MÉTODOS DE PAGO Y TRANSFERENCIA* 💳

Aceptamos transferencias SPEI y depósitos:
• *Bancos:* BBVA / BanCoppel / Nu / Banco Azteca / OXXO
• *Concepto:* Tu nombre o trámite solicitado

_Envía la foto de tu comprobante en este chat para validar y procesar tu entrega inmediata._`;
      await sock.sendMessage(from, { text: pago });
    }

    // 7. Soporte
    else if (text === '.soporte' || text === 'soporte') {
      await sock.sendMessage(from, { 
        text: '👨‍💻 Un asesor humano revisará tus datos en este chat en breve. Por favor deja tu mensaje.' 
      });
    }

    // 8. Ping
    else if (text === 'ping') {
      await sock.sendMessage(from, { text: '🏓 ¡Pong! El bot está conectado y activo.' });
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
        body { font-family: Arial, sans-serif; background: #0b141a; color: #e9edef; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { background: #111b21; padding: 2.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-width: 420px; width: 90%; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #00a884; }
        p { color: #8696a0; font-size: 0.95rem; margin-bottom: 1.5rem; }
        .qr-box { background: white; padding: 1rem; border-radius: 8px; display: inline-block; margin-bottom: 1.5rem; }
        img { width: 250px; height: 250px; display: block; }
        .status { font-weight: bold; padding: 0.6rem 1rem; border-radius: 6px; background: #202c33; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Vincular WhatsApp</h1>
        <p>Abre WhatsApp en tu teléfono > Dispositivos vinculados > Vincular un dispositivo.</p>
        <div class="qr-box">
          ${currentQR ? `<img src="${currentQR}" alt="Código QR WhatsApp" />` : `<div style="width:250px;height:250px;display:flex;align-items:center;justify-content:center;color:#333;font-size:0.9rem;"><b>${botStatus}</b></div>`}
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
