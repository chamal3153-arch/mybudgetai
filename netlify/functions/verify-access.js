const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let email;
  try {
    email = JSON.parse(event.body || '{}').email?.toLowerCase()?.trim();
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/purchases?email=eq.${encodeURIComponent(email)}&limit=1&select=id,created_at,amount_cents`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    }
  );

  const data = await res.json();
  const hasAccess = Array.isArray(data) && data.length > 0;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ hasAccess, email })
  };
};
