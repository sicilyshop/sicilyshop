const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = 'TUA_CLIENT_ID_PAYPAL';
const CLIENT_SECRET = 'TUA_CLIENT_SECRET_PAYPAL';
const PAYPAL_API = 'https://api-m.paypal.com'; // LIVE API

const products = {
  controller_ps5: { name: 'Controller PS5', price: '59.99' },
  maglietta_gaming: { name: 'Maglietta Gaming', price: '24.99' },
  cuffie_rgb: { name: 'Cuffie RGB', price: '39.99' }
};

app.post('/create-order', async (req, res) => {
  const { productId } = req.body;
  const product = products[productId];
  if (!product) return res.status(400).send({ error: 'Prodotto non trovato' });

  try {
    const tokenRes = await axios({
      url: `${PAYPAL_API}/v1/oauth2/token`,
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: { username: CLIENT_ID, password: CLIENT_SECRET },
      data: 'grant_type=client_credentials'
    });

    const orderRes = await axios({
      url: `${PAYPAL_API}/v2/checkout/orders`,
      method: 'post',
      headers: {
        Authorization: `Bearer ${tokenRes.data.access_token}`,
        'Content-Type': 'application/json'
      },
      data: {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: product.price
          },
          description: product.name
        }],
        application_context: {
          return_url: 'https://tuosito.com/success',
          cancel_url: 'https://tuosito.com/cancel'
        }
      }
    });

    const approveUrl = orderRes.data.links.find(link => link.rel === 'approve').href;
    res.json({ url: approveUrl });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send({ error: 'Errore PayPal' });
  }
});

app.listen(3000, () => console.log('✅ Backend PayPal avviato su http://localhost:3000'));
