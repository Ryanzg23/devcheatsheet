import { Client } from "pg";

export default async (req) => {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL
  });

  await client.connect();

  /* ---------- ensure table ---------- */
  await client.query(`
    CREATE TABLE IF NOT EXISTS htaccess_rules (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* ---------- GET ---------- */
  if (req.method === "GET") {
    const { rows } = await client.query(
      "SELECT title, code FROM htaccess_rules ORDER BY id ASC"
    );

    await client.end();

    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /* ---------- POST ---------- */
  if (req.method === "POST") {
    const body = await req.json();
    const { title, code } = body;

    if (!title || !code) {
      await client.end();
      return new Response("Missing fields", { status: 400 });
    }

    await client.query(
      "INSERT INTO htaccess_rules (title, code) VALUES ($1, $2)",
      [title, code]
    );

    await client.end();

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  await client.end();
  return new Response("Method not allowed", { status: 405 });
};
