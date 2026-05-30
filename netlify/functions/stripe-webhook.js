const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];

  let stripeEvent;
  try {
    stripeEvent = verifyWebhook(event.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const email = session.customer_details?.email?.toLowerCase();
    const sessionId = session.id;
    const amountCents = session.amount_total;

    if (!email) {
      console.error('No email in session:', sessionId);
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal,resolution=ignore-duplicates'
      },
      body: JSON.stringify({
        email,
        stripe_session_id: sessionId,
        amount_cents: amountCents,
        access_token: 'mbr_2025_full'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase insert failed:', errText);
    } else {
      console.log(`Purchase recorded for ${email}`);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

function verifyWebhook(payload, signature, secret) {
  if (!secret) throw new Error('No webhook secret configured');

  const parts = signature.split(',').reduce((acc, part) => {
    const [key, val] = part.split('=');
    acc[key] = val;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const v1 = parts['v1'];

  if (!timestamp || !v1) throw new Error('Invalid signature format');

  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
  if (age > 300) throw new Error('Timestamp too old');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  if (expected !== v1) throw new Error('Signature mismatch');

  return JSON.parse(payload);
}
