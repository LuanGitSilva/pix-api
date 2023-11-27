const https = require('https');
const axios = require('axios');
const fs = require('fs');

const apiProduction = 'https://pix.api.efipay.com.br';
const apiStaging = 'https://pix-h.api.efipay.com.br';

const baseUrl = process.env.GN_ENV === 'producao' ? apiProduction : apiStaging;

// criando o access token do cliente
const getToken = async() => {
    const certificado = fs.readFileSync('../' + process.env.GN_CERTIFICADO);
    const credenciais = {
        client_id: process.env.GN_CLIENT_ID,
        client_secret: process.env.GN_CLIENT_SECRET,
    }
    const data = JSON.stringify({ grant_type: 'client_credentials' });
    const dataCredenciais = credenciais.client_id + ':' + credenciais.client_secret;
    const auth = Buffer.from(dataCredenciais).toString('base64');

    const agent = new https.Agent({
        pfx: certificado,
        passphrase: '',
    });

    const config = {
        method: 'POST',
        url: baseUrl + '/oauth/token',
        headers: {
            Authorization: 'Basic ' + auth,
            'Content-type': 'application/json',
        },
        httpsAgent: agent,
        data: data,
    }
    const result = await axios(config);
    return result.data;
}

const createCharge = async(accessToken, chargeData) => {
    const certificado = fs.readFileSync('../' + process.env.GN_CERTIFICADO);
    const data = JSON.stringify(chargeData);

    const agent = new https.Agent({
        pfx: certificado,
        passphrase: '',
    });

    const config = {
        method: 'POST',
        url: baseUrl + '/v2/cob',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-type': 'application/json',
        },
        httpsAgent: agent,
        data: data,
    }
    const result = await axios(config);
    return result.data;
}

const getLoc = async(accessToken, locId) => {
    const certificado = fs.readFileSync('../' + process.env.GN_CERTIFICADO);

    const agent = new https.Agent({
        pfx: certificado,
        passphrase: '',
    });

    const config = {
        method: 'GET',
        url: baseUrl + '/v2/loc/' + locId + '/qrcode',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-type': 'application/json',
        },
        httpsAgent: agent
    }
    const result = await axios(config);
    return result.data;
}

// Criando a cobrança pix do pedido
const createPixCharge = async(data) => {
    const chave = process.env.CHAVE_PIX;
    const token = await getToken();
    const accessToken = token.access_token;

    const cob = { 
        "calendario": {
            "expiracao": 3600
        },
        "devedor": {
            "cpf": data.cpf,
            "nome": data.nome
        },
        "valor": {
            "original": data.total
        },
        "chave": chave,
        "solicitacaoPagador": "Cobrança de produtos vendidos."
     }

    const cobranca = await createCharge(accessToken, cob);
    const qrcode = await getLoc(accessToken, cobranca.loc.id);
    return { qrcode, cobranca };
}

const createWebhook = async(certPath, chavePix, baseUrl, webhookUrl, configData) => {
    const chave = chavePix;
    const token = await getToken(configData);
    const accessToken = token.access_token;
    const certificado = fs.readFileSync(certPath);
    const data = JSON.stringify({
        webhookUrl: webhookUrl,
    });

    const agent = new https.Agent({ 
        pfx: certificado,
        passphrase: '',
    });

    const config = {
        method: 'PUT',
        url: baseUrl + '/v2/webhook/' + chave,
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-type': 'application/json',
        },
        httpsAgent: agent,
        data: data
    }
    const result = await axios(config);
    return result.data;
}

const getPix = async (data) => {
    const chave = process.env.CHAVE_PIX;
    const token = await getToken();
    const accessToken = token.access_token;

    const certificado = fs.readFileSync('../' + process.env.GN_CERTIFICADO);

    const agent = new https.Agent({
        pfx: certificado,
        passphrase: '',
    });
    
    const config = {
        method: 'GET',
        url: baseUrl + '/v2/cob/'+data.txid,
        httpsAgent: agent,
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-type': 'application/json',
        },
    };

    try {
        const response = await axios(config);
        return { data: response.data };
    } catch (error) {
        console.error('Erro na solicitação GET:', error);
        throw error;
    }
};

module.exports = {
    createPixCharge,
    createWebhook,
    getPix
}
