require('dotenv').config();
const axios = require('axios');

const EMAIL = process.env.API_EMAIL;
const API_KEY = process.env.API_KEY;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Email': EMAIL,
  'X-API-Key': API_KEY,
  'X-EMAIL': EMAIL,
  'X-API-KEY': API_KEY
});

// 1. Catálogo de servicios
async function obtenerServicios() {
  const res = await axios.get('https://colores-primarios.uk/api/api.php?action=listar', {
    headers: getHeaders()
  });
  return res.data;
}

// 2. Realizar orden
async function crearOrden(servicioId, datos = {}) {
  const payload = {
    id: servicioId,
    ...datos
  };
  const res = await axios.post('https://colores-primarios.uk/api/api.php?action=ordenar', payload, {
    headers: getHeaders()
  });
  return res.data;
}

// 3. Consultar saldo
async function consultarSaldo() {
  const res = await axios.get('https://colores-primarios.uk/api/saldo.php', {
    headers: getHeaders()
  });
  return res.data;
}

// 4. Historial de órdenes
async function consultarHistorial() {
  const res = await axios.post('https://colores-primarios.uk/api/historial.php', {}, {
    headers: getHeaders()
  });
  return res.data;
}

// 5. Consultar orden específica
async function consultarOrden(orderId) {
  const payload = { order_id: orderId };
  const res = await axios.post('https://colores-primarios.uk/api.php?action=consultar', payload, {
    headers: getHeaders()
  });
  return res.data;
}

module.exports = {
  obtenerServicios,
  crearOrden,
  consultarSaldo,
  consultarHistorial,
  consultarOrden
};