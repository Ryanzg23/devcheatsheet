import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL);

export async function handler(event) {
  try {
    if (event.httpMethod === "GET") {
      const rows = await sql`SELECT * FROM cpanel_rules ORDER BY id DESC`;
      return json(rows);
    }

    const body = JSON.parse(event.body || "{}");

    if (event.httpMethod === "POST") {
      const row = await sql`
        INSERT INTO cpanel_rules (title, description, code)
        VALUES (${body.title}, ${body.description}, ${body.code})
        RETURNING id
      `;
      return json({ id: row[0].id });
    }

    if (event.httpMethod === "PUT") {
      await sql`
        UPDATE cpanel_rules
        SET title=${body.title}, description=${body.description}, code=${body.code}
        WHERE id=${body.id}
      `;
      return json({ ok: true });
    }

    if (event.httpMethod === "DELETE") {
      await sql`DELETE FROM cpanel_rules WHERE id=${body.id}`;
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return {
    statusCode: status,
    body: JSON.stringify(data)
  };
}
