const express = require('express');
const cors = require('cors');
const { createPixCharge, getPix } = require('./lib/pix');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ ok: true });
})
app.post('/create-order', async(req, res) => {
  console.log(req.body)
  const pixCharge = await createPixCharge(req.body);
  const { qrcode, cobranca } = pixCharge;
  res.send({ ok: true, qrcode, cobranca });
});

app.post("/webhook", (request, response) => {
  if (request.socket.authorized) { 
    response.status(200).end();
  } else {
    response.status(401).end();
  }
});

app.post('/webhook/pix*', (req, res) => {
  console.log('webhook received');
  const { pix } = req.body;
  if (!request.client.authorized) { 
    return res.status(401).send('Invalid client certification.');
  }
  res.send({ ok: true, pix });
});

app.post('/get-pix', async(req, res) => {
  console.log(req.body)
  const information = await getPix(req.body);
  res.send({ ok: true, information });
});

module.exports = app;