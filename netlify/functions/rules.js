import { neon } from "@netlify/neon";

export default async (req) => {
  const sql = neon(); // uses NETLIFY_DATABASE_URL automatically

  /* ---------- ensure table ---------- */
  await sql`
    CREATE TABLE IF NOT EXISTS htaccess_rules (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  /* ---------- GET rules ---------- */
  if (req.method === "GET") {
    const rows = await sql`
      SELECT title, code
      FROM htaccess_rules
      ORDER BY id ASC
    `;

    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /* ---------- ADD rule ---------- */
  if (req.method === "POST") {
    const body = await req.json();
    const { title, code } = body;

    if (!title || !code) {
      return new Response("Missing fields", { status: 400 });
    }

    await sql`
      INSERT INTO htaccess_rules (title, code)
      VALUES (${title}, ${code})
    `;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
};
