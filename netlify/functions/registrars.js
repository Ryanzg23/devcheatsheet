const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {

  const method = event.httpMethod;

  /* ================= GET ================= */

  if(method === "GET"){
    const rows = await sql`
      SELECT * FROM domain_registrars
      ORDER BY id ASC
    `;

    return {
      statusCode:200,
      body:JSON.stringify(rows)
    };
  }

  const data = JSON.parse(event.body || "{}");

  /* ================= POST ================= */

  if(method === "POST"){

    const result = await sql`
      INSERT INTO domain_registrars (title, description, code)
      VALUES (${data.title}, ${data.description}, ${data.code})
      RETURNING id
    `;

    return {
      statusCode:200,
      body:JSON.stringify({ id: result[0].id })
    };

  }

  /* ================= PUT ================= */

  if(method === "PUT"){

    await sql`
      UPDATE domain_registrars
      SET title=${data.title},
          description=${data.description},
          code=${data.code}
      WHERE id=${data.id}
    `;

    return { statusCode:200 };

  }

  /* ================= DELETE ================= */

  if(method === "DELETE"){

    await sql`
      DELETE FROM domain_registrars
      WHERE id=${data.id}
    `;

    return { statusCode:200 };

  }

};
