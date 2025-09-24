const express = require('express');
// Esta liubrería sierve apra que el proxy pueda transferir información a las máquinas. 
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

const options = {
  // 
  target: 'http://127.0.0.1:8080', 
  //nombre del dominio. se suele poner dev-nombreDominio
  cookieDomainRewrite: 'dev-bot.com', 
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: function(proxyReq, req, res) {
    if (!req.headers['accept-language']) {
      proxyReq.setHeader('Accept-Language', 'es-ES,es;q=0.9,en;q=0.8');
    } else {
      proxyReq.setHeader('Accept-Language', req.headers['accept-language']);
    }
  }
};

// Se carga todo lo de la api. 
app.use('/api', createProxyMiddleware(options));

//cuando alguien escribe /admin, se le redirige a la máquina de ese target (la que se carga con npm run dev del package json y vite.config.js)
options.target = 'http://localhost:5171';
app.use('/admin', createProxyMiddleware(options));

options.target = 'http://localhost:5177';
app.use('/', createProxyMiddleware(options));

// Si queremos crear un nuevo entorno se crea un nuevo de estos, poniendo la ruta  y puerto que se ponga en su vite.config.js correspondiente. 

// Se utiliza el puerto 80, que es el puerto por defecto en el navegador sin certificado de seguridad. No necesitamos certificado en nuestro ordenador. 
app.listen(80, '127.0.0.1');
