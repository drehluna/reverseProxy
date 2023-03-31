const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');

// Define o servidor proxy reverso
http.createServer(onRequest).listen(process.env.PORT || 8080);

function onRequest(client_req, client_res) {
  console.log('Servidor Proxy: solicitado', client_req.url);

  // Verifica se o caminho da solicitação termina com "/favicon.ico"
  if (client_req.url.endsWith('/favicon.ico')) {
    // Se a solicitação for para o arquivo favicon.ico, retorna uma resposta vazia
    client_res.writeHead(204);
    client_res.end();
    return;
  }

  // Extrai a URL do servidor de destino da solicitação
  const options = url.parse(client_req.url.substring(1));

  // Define o agente para a solicitação HTTPS
  options.agent = new https.Agent({
    rejectUnauthorized: false,
  });

  // Adiciona os cabeçalhos Access-Control-Allow-Origin e Access-Control-Allow-Methods
  client_res.setHeader('Access-Control-Allow-Origin', '*');
  client_res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  client_res.setHeader('Access-Control-Expose-Headers', 'x-amz-id-2,x-amz-request-id,date,last-modified,etag,x-amz-server-side-encryption,cache-control,x-amz-version-id,accept-ranges,content-type,server,content-length,connection,x-final-url,access-control-allow-origin,x-request-url')
  client_res.setHeader('X-Final-Url', client_req.url);
  client_res.setHeader('X-Request-Url', options.hostname + options.path);

  // Encaminha a solicitação para o servidor de destino
  const proxy = https.request(options, (res) => {
    client_res.writeHead(res.statusCode, res.headers);
    res.pipe(client_res, {
      end: true,
    });
  });

  // Repassa o corpo da solicitação do cliente para o servidor de destino
  client_req.pipe(proxy, {
    end: true,
  });

  // Trata os erros de solicitação do servidor de destino
  proxy.on('error', (err) => {
    console.error('Erro ao enviar solicitação para', options.host, ':', err);
    client_res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    client_res.end('Erro ao enviar solicitação para ' + options.host);
  });
}
