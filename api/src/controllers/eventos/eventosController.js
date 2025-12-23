// Controlador de eventos

let redis;
try {
  const Redis = require('ioredis');
  redis = new Redis();
  redis.on('error', (err) => {
    console.error('[Redis] Error de conexión:', err.message);
  });
} catch (e) {
  console.error('[Redis] No se pudo cargar ioredis:', e.message);
}

module.exports = {
  async ejemplo(req, res) {
    try {
      // Ejemplo de uso de Redis
      if (!redis) {
        return res.status(500).json({ ok: false, error: 'Redis no está disponible' });
      }
      await redis.set('clave', 'valor');
      const valor = await redis.get('clave');
      res.json({ ok: true, valor });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
};
