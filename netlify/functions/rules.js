const { neon } = require("@neondatabase/serverless");

exports.handler = async (event) => {

  
  const sql = neon();

  const method = event.httpMethod;

  // Ensure table exists
  await sql`
    CREATE TABLE IF NOT EXISTS htaccess_rules (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  /* GET */
  if (method === "GET") {
    const rows = await sql`
      SELECT id, title, description, code
      FROM htaccess_rules
      ORDER BY id ASC
    `;

    return {
      statusCode: 200,
      body: JSON.stringify(rows)
    };
  }

  const data = JSON.parse(event.body || "{}");

  /* POST */
  if (method === "POST") {
    const result = await sql`
      INSERT INTO htaccess_rules (title, description, code)
      VALUES (${data.title}, ${data.description}, ${data.code})
      RETURNING id
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ id: result[0].id })
    };
  }

  /* PUT */
  if (method === "PUT") {
    await sql`
      UPDATE htaccess_rules
      SET title=${data.title},
          description=${data.description},
          code=${data.code}
      WHERE id=${data.id}
    `;

    return { statusCode: 200 };
  }

  /* DELETE */
  if (method === "DELETE") {
    await sql`
      DELETE FROM htaccess_rules
      WHERE id=${data.id}
    `;

    return { statusCode: 200 };
  }

  return { statusCode: 405 };
};
