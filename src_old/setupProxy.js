const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/postgresApi', {
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {"^/postgresApi": ""},
      headers: {Connection: "keep-alive"}
    })
  );
}