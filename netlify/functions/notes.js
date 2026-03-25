const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {

  const method = event.httpMethod;

  /* GET */
  if(method === "GET"){
    const rows = await sql`
      SELECT id, title, text_instructions, code, instructions
      FROM important_notes
      ORDER BY id ASC
    `;

    return {
      statusCode:200,
      body:JSON.stringify(rows)
    };
  }

  const data = JSON.parse(event.body || "{}");

  /* POST */
  if(method === "POST"){
    const result = await sql`
      INSERT INTO important_notes (title, text_instructions, code, instructions)
      VALUES (${data.title}, ${data.text_instructions}, ${data.code}, ${data.instructions})
      RETURNING id
    `;

    return {
      statusCode:200,
      body:JSON.stringify({id:result[0].id})
    };
  }

  /* PUT */
  if(method === "PUT"){
    await sql`
      UPDATE important_notes
      SET title=${data.title},
          text_instructions=${data.text_instructions},
          code=${data.code},
          instructions=${data.instructions}
      WHERE id=${data.id}
    `;

    return {statusCode:200};
  }

  /* DELETE */
  if(method === "DELETE"){
    await sql`
      DELETE FROM important_notes
      WHERE id=${data.id}
    `;

    return {statusCode:200};
  }

};
