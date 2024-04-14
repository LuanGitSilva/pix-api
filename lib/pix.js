const https = require('https');
const axios = require('axios');
const fs = require('fs');

const apiProduction = 'https://pix.api.efipay.com.br';
const apiStaging = 'https://pix-h.api.efipay.com.br';

const baseUrl = process.env.GN_ENV === 'producao' ? apiProduction : apiStaging;

// criando o access token do cliente
const getToken = async(info) => {
    const certificado = fs.readFileSync(info.certificado);
    const credenciais = {
        client_id: info.clientid,
        client_secret: info.clientsecret,
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

const createCharge = async(accessToken, chargeData, data) => {
    const certificado = fs.readFileSync(data.certificado);
    const info = JSON.stringify(chargeData);

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
        data: info,
    }
    const result = await axios(config);
    return result.data;
}

const getLoc = async(accessToken, locId, data) => {
    const certificado = fs.readFileSync(data.certificado);

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
    console.log(data);

    // const chave = data.chave;
    // const token = await getToken(data);
    // const accessToken = token.access_token;

    // const cob = { 
    //     "calendario": {
    //         "expiracao": 3600
    //     },
    //     "devedor": {
    //         "cpf": data.cpf,
    //         "nome": data.nome
    //     },
    //     "valor": {
    //         "original": data.total
    //     },
    //     "chave": chave,
    //     "solicitacaoPagador": "Cobrança de produtos vendidos."
    //  }

    // const cobranca = await createCharge(accessToken, cob, data);
    // const qrcode = await getLoc(accessToken, cobranca.loc.id, data);
    // return { qrcode, cobranca };
}

const createWebhook = async(tenants) => {
    const webhookResults = [];

    for (const tenant of tenants) {
        const { chavePix, gnCertificado } = tenant;
        const clientid = tenant.gnClientId;
        const clientsecret = tenant.gnClientSecret;
        const certificado = tenant.gnCertificado;
        const info = {certificado, clientid, clientsecret};

        const chave = chavePix;
        const cert = fs.readFileSync(gnCertificado);
        const token = await getToken(info);
        const accessToken = token.access_token;
    
        const data = JSON.stringify({
            webhookUrl: 'https://api-pix.lsdeveloper.com.br/webhook'
        });
    
        const agent = new https.Agent({ 
            pfx: cert,
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
        webhookResults.push(result);    
    }
    return webhookResults;
}

const getPix = async (data) => {
    const token = await getToken(data);
    const accessToken = token.access_token;

    const certificado = fs.readFileSync(data.certificado);

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
