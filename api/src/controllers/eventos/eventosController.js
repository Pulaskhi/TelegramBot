// Controlador de eventos



module.exports = {
  async ejemplo(req, res) {
    try {
      // Aquí iría la lógica de eventos sin Redis
      res.json({ ok: true, valor: 'sin Redis' });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
};
