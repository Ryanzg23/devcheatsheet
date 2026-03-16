export async function handler(event) {
  const url = event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing url" })
    };
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Bulk SEO Meta Viewer)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const status = res.status;
    const location = res.headers.get("location");

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        url,
        status,
        redirect: location || null
      })
    };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        url,
        error: true
      })
    };
  }
}
