const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {

  const method = event.httpMethod;

  if(method === "GET"){
    const rows = await sql`SELECT * FROM cloudflare_rules ORDER BY id DESC`;
    return {
      statusCode:200,
      body:JSON.stringify(rows)
    };
  }

  const data = JSON.parse(event.body || "{}");

  if(method === "POST"){
    const result = await sql`
      INSERT INTO cloudflare_rules (title, description, code)
      VALUES (${data.title}, ${data.description}, ${data.code})
      RETURNING id
    `;

    return {
      statusCode:200,
      body:JSON.stringify({id:result[0].id})
    };
  }

  if(method === "PUT"){
    await sql`
      UPDATE cloudflare_rules
      SET title=${data.title},
          description=${data.description},
          code=${data.code}
      WHERE id=${data.id}
    `;

    return {statusCode:200};
  }

  if(method === "DELETE"){
    await sql`DELETE FROM cloudflare_rules WHERE id=${data.id}`;
    return {statusCode:200};
  }

};
