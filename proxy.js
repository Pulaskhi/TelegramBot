const express = require('express');
// Esta liubrería sierve apra que el proxy pueda transferir información a las máquinas. 
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();


// Proxy para /api -> backend
app.use('/api', createProxyMiddleware({
  target: 'http://127.0.0.1:8080',
  changeOrigin: true,
  logLevel: 'debug',
  pathRewrite: {
    '^/api': '/api'
  },
  cookieDomainRewrite: 'dev-bot.com',
  onProxyReq: function(proxyReq, req, res) {
    if (!req.headers['accept-language']) {
      proxyReq.setHeader('Accept-Language', 'es-ES,es;q=0.9,en;q=0.8');
    } else {
      proxyReq.setHeader('Accept-Language', req.headers['accept-language']);
    }
  }
}));

// Proxy para /admin -> front-admin
app.use('/admin', createProxyMiddleware({
  target: 'http://localhost:5171',
  changeOrigin: true,
  logLevel: 'debug',
  cookieDomainRewrite: 'dev-bot.com',
}));

// Proxy para / -> front-customer
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5177',
  changeOrigin: true,
  logLevel: 'debug',
  cookieDomainRewrite: 'dev-bot.com',
}));

// Se utiliza el puerto 8082 para evitar conflictos con el puerto 8081.
app.listen(8082, '127.0.0.1');
