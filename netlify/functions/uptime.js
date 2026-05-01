/**
 * netlify/functions/uptime.js
 * CORS proxy for UptimeRobot API v2.
 * Keeps API key server-side. Returns normalized monitor data.
 *
 * Env var required: UPTIMEROBOT_API_KEY
 * Deploy: set in Netlify → Site Settings → Environment Variables
 */

const UPTIMEROBOT_API = 'https://api.uptimerobot.com/v2/getMonitors';

// UptimeRobot status codes
const STATUS = {
  0: 'paused',
  1: 'not_checked',
  2: 'up',
  8: 'degraded', // "seems down" in UptimeRobot terminology
  9: 'down',
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Trim to guard against copy-paste whitespace
  const apiKey = (process.env.UPTIMEROBOT_API_KEY || '').trim();
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'UPTIMEROBOT_API_KEY not configured' }),
    };
  }

  try {
    const res = await fetch(UPTIMEROBOT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_key: apiKey,
        format: 'json',
        logs: '1',
        logs_limit: '10',
        response_times: '1',
        response_times_limit: '30',
        custom_uptime_ratios: '30',
      }).toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`UptimeRobot HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();

    if (json.stat !== 'ok') {
      // Return the full UptimeRobot error object so we can see what's wrong
      const detail = json.error
        ? `code=${json.error.type} message="${json.error.message}"`
        : JSON.stringify(json);
      throw new Error(`UptimeRobot rejected request: ${detail}`);
    }

    // Normalize to a simpler shape the app can consume directly
    const monitors = (json.monitors || []).map((m) => ({
      id: m.id,
      name: m.friendly_name,
      url: m.url,
      status: STATUS[m.status] || 'unknown',
      uptime30d: parseFloat(m.custom_uptime_ratio) || null,
      // Sparkline: array of {t: timestamp, value: ms} for last 30 data points
      responseTimes: (m.response_times || []).map((r) => ({
        t: r.datetime,
        ms: r.value,
      })),
      // Incident log: array of {type, datetime, duration}
      // type 1 = down, type 2 = up (monitor came back)
      logs: (m.logs || []).map((l) => ({
        type: l.type === 1 ? 'down' : l.type === 2 ? 'up' : 'other',
        datetime: l.datetime, // unix timestamp
        duration: l.duration, // seconds
        reason: l.reason?.detail || null,
      })),
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ monitors, fetchedAt: Date.now() }),
    };
  } catch (err) {
    console.error('Uptime proxy error:', err);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
