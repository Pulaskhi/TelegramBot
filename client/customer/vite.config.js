export default {
  base: '/',
  server: {
    port: 5177,
    open: false, // No abrir automáticamente en 5177
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
}
// IMPORTANTE: Accede a la web desde http://localhost:8082 para que el proxy funcione correctamente con la API y el frontend.
// Si no se escribe nada se entrará en el servidor indicado, a ese entorno
