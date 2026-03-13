const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event) => {

  const method = event.httpMethod;

  /* ================= GET ================= */

  if(method === "GET"){
    const rows = await sql`
      SELECT * FROM registrars
      ORDER BY id DESC
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
      INSERT INTO registrars (title, description, code)
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
      UPDATE registrars
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
      DELETE FROM registrars
      WHERE id=${data.id}
    `;

    return { statusCode:200 };

  }

};
