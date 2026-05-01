exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "API key not configured" }) };
  }
  try {
    const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ api_key: apiKey, format: "json", logs: "1", log_limit: "10", response_times: "1", response_times_limit: "30" }),
    });
    const data = await response.json();
    if (data.stat !== "ok") {
      return { statusCode: 502, headers, body: JSON.stringify({ error: "UptimeRobot error", detail: data }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Function error", detail: err.message }) };
  }
};
