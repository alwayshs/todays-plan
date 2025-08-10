import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const TOSS_SECRET_KEY = process.env.TOSS_API_KEY;
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

// ---------------- API 라우팅: 정적 파일보다 먼저 선언 ----------------

app.get('/api/config', (req, res) => {
  res.json({ tossClientKey: TOSS_CLIENT_KEY });
});

app.post('/api/generate', async (req, res) => {
  console.log('POST /api/generate 요청:', req.body);

  try {
    const { interest, region, goal } = req.body;
    if (!interest || !region || !goal) return res.status(400).json({ error: '필수 파라미터 누락' });

    const bodyPayload = {
      contents: [
        {
          parts: [
            {
              text: `Interest: ${interest}, Region: ${region}, Goal: ${goal}`
            }
          ]
        }
      ]
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const aiReply = data?.candidates?.[0]?.content || 'No response';

    res.json({ previewText: aiReply });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/create-payment', async (req, res) => {
  try {
    const { amount, orderName } = req.body;
    if (!amount || !orderName) return res.status(400).json({ error: 'Amount or orderName missing' });

    const orderId = `order_${Date.now()}`;
    const successUrl = `${DOMAIN}/payment-success.html?orderId=${orderId}`;
    const failUrl = `${DOMAIN}/payment-fail.html?orderId=${orderId}`;

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        amount,
        orderId,
        orderName,
        successUrl,
        failUrl,
      }),
    });

    if (!tossRes.ok) {
      const errText = await tossRes.text();
      console.error('Toss payment API error:', errText);
      return res.status(tossRes.status).json({ error: errText });
    }

    const paymentData = await tossRes.json();
    res.json(paymentData);
  } catch (e) {
    console.error('create-payment error:', e);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});

// ---------------- 정적 파일 서비스 및 catch-all 라우트 ----------------

app.use(express.static(path.join(process.cwd(), '..', 'frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
