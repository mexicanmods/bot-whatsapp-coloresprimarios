/**
 * Servidor Todo en Uno - index.js
 * Servidor Express con frontend embebido y API REST completa.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Frontend Embebido (HTML + CSS)
const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Plataforma | Panel Central</title>
  <style>
    :root {
      --bg-color: #0f172a;
      --card-bg: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --border: #334155;
      --success: #22c55e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background-color: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
    }
    nav {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { font-weight: 700; font-size: 1.25rem; color: var(--text-main); text-decoration: none; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(34, 197, 94, 0.15);
      color: var(--success);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; }
    main {
      flex: 1;
      max-width: 1100px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      width: 100%;
    }
    .hero { text-align: center; padding: 3rem 1rem; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    .hero p { font-size: 1.15rem; color: var(--text-muted); max-width: 650px; margin: 0 auto 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .card { background-color: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 1.75rem; }
    .card h2 { font-size: 1.25rem; margin-bottom: 0.75rem; }
    .card p { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem; }
    code {
      display: block;
      background-color: #0b1120;
      padding: 0.6rem 0.8rem;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.85rem;
      color: #38bdf8;
      border: 1px solid #1e293b;
    }
    footer { border-top: 1px solid var(--border); padding: 2rem 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/" class="logo">Servidor Node.js</a>
      <span class="badge"><span class="dot"></span> Online</span>
    </nav>
  </header>
  <main>
    <section class="hero">
      <h1>Panel de Control & API Integrada</h1>
      <p>Servidor activo ejecutando interfaz web y servicios backend en un solo archivo index.js.</p>
    </section>
    <div class="grid">
      <article class="card">
        <h2>Verificar Estado (Health)</h2>
        <p>Endpoint para monitoreo de uptime y conectividad.</p>
        <code>GET /api/health</code>
      </article>
      <article class="card">
        <h2>Listar Registros</h2>
        <p>Obtiene los elementos almacenados en formato JSON.</p>
        <code>GET /api/items</code>
      </article>
      <article class="card">
        <h2>Crear Registro</h2>
        <p>Envía datos mediante petición POST con payload JSON.</p>
        <code>POST /api/items</code>
      </article>
    </div>
  </main>
  <footer>
    <p>&copy; 2026 Todos los derechos reservados.</p>
  </footer>
</body>
</html>`;

// Servir frontend en la raíz
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(htmlContent);
});

// Rutas de API REST
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: `${Math.floor(process.uptime())} segundos`,
    timestamp: new Date().toISOString()
  });
});

const itemsDb = [
  { id: 1, name: 'Servicio Web', status: 'Activo' },
  { id: 2, name: 'Base de Datos', status: 'Conectado' }
];

app.get('/api/items', (req, res) => {
  res.status(200).json({
    success: true,
    total: itemsDb.length,
    data: itemsDb
  });
});

app.post('/api/items', (req, res) => {
  const { name, status } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'El campo "name" es obligatorio' });
  }

  const newItem = {
    id: itemsDb.length + 1,
    name,
    status: status || 'Activo',
    createdAt: new Date().toISOString()
  };

  itemsDb.push(newItem);
  res.status(201).json({ success: true, message: 'Registro añadido con éxito', data: newItem });
});

// Manejo de 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.originalUrl}` });
});

// Manejo Global de Errores (500)
app.use((err, req, res, next) => {
  console.error('Error del servidor:', err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Error interno del servidor' });
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo exitosamente en el puerto ${PORT}`);
  console.log(`🌐 Interfaz web: http://localhost:${PORT}`);
  console.log(`📡 Endpoint API: http://localhost:${PORT}/api/health`);
});