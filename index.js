require('dotenv').config({ path: './.env.producao' });

const https = require('https');
const fs = require('fs');
const app = require('./app');
const { createWebhook } = require('./lib/pix');
const { getConfigById } = require('./empresaConfig');
const remoteCertURL = 'https://pix.gerencianet.com.br/webhooks/chain-pix-prod.crt';

// Função para baixar o certificado remoto
function downloadRemoteCertificate(remoteURL, callback) {
  https.get(remoteURL, (response) => {
    if (response.statusCode !== 200) {
      callback(new Error('Falha ao baixar o certificado remoto'), null);
      return;
    }

    let certData = '';

    response.on('data', (chunk) => {
      certData += chunk;
    });

    response.on('end', () => {
      callback(null, certData);
    });
  }).on('error', (error) => {
    callback(error, null);
  });
}

// Baixe o certificado remoto e configure as opções (certificados gerados no certbot)
downloadRemoteCertificate(remoteCertURL, (error, certData) => {
  if (error) {
    console.error('Erro ao baixar o certificado remoto:', error);
    return;
  }

  const options = {
    // TLS
    key: fs.readFileSync('/etc/letsencrypt/live/api-pix.lsdeveloper.com.br/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/api-pix.lsdeveloper.com.br/fullchain.pem'),

    // MTLS (usando o certificado remoto)
    ca: certData, 
    minVersion: 'TLSv1.2',
    requestCert: true,
    rejectUnauthorized: false,
  };

  const server = https.createServer(options, app);
  server.listen(443, async () => {
    const tenants = await getConfigById();
    createWebhook(tenants).then(() => {
      console.log('Webhooks criados com sucesso.');
    }).catch((err) => {
      console.error('Erro ao criar webhook:', err);
    });
  });
});

// const pegar = async () => {
//   const tenants = await getConfigById();
//   return tenants;
// }

// pegar().then(result => console.log(result)).catch(error => console.error(error));