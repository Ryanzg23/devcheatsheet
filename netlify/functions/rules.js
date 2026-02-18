import { neon } from "@neondatabase/serverless";

export default async (req) => {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS htaccess_rules (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  /* GET */
  if (req.method === "GET") {
    const rows = await sql`
      SELECT id, title, code
      FROM htaccess_rules
      ORDER BY id ASC
    `;
    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /* POST (add) */
  if (req.method === "POST") {
    const { title, code } = await req.json();

    const [row] = await sql`
      INSERT INTO htaccess_rules (title, code)
      VALUES (${title}, ${code})
      RETURNING id
    `;

    return new Response(JSON.stringify({ id: row.id }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /* PUT (edit) */
  if (req.method === "PUT") {
    const { id, title, code } = await req.json();

    await sql`
      UPDATE htaccess_rules
      SET title=${title}, code=${code}
      WHERE id=${id}
    `;

    return new Response(JSON.stringify({ ok: true }));
  }

  /* DELETE */
  if (req.method === "DELETE") {
    const { id } = await req.json();

    await sql`
      DELETE FROM htaccess_rules
      WHERE id=${id}
    `;

    return new Response(JSON.stringify({ ok: true }));
  }

  return new Response("Method not allowed", { status: 405 });
};
