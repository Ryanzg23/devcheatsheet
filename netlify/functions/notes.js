const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {

  const method = event.httpMethod;

  /* GET */
  if(method === "GET"){
    const rows = await sql`
      SELECT * FROM important_notes ORDER BY id ASC
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
      INSERT INTO important_notes (title, steps)
      VALUES (${data.title}, ${JSON.stringify(data.steps)})
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
          steps=${JSON.stringify(data.steps)}
      WHERE id=${data.id}
    `;

    return {statusCode:200};
  }

  /* DELETE */
  if(method === "DELETE"){
    await sql`
      DELETE FROM important_notes WHERE id=${data.id}
    `;
    return {statusCode:200};
  }

};
