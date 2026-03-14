const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.NETLIFY_DATABASE_URL);

exports.handler = async (event) => {

  const method = event.httpMethod;

  if(method === "GET"){
    const rows = await sql`
      SELECT * FROM ssh_commands
      ORDER BY id DESC
    `;

    return {
      statusCode:200,
      body:JSON.stringify(rows)
    };
  }

  const data = JSON.parse(event.body || "{}");

  if(method === "POST"){
    const result = await sql`
      INSERT INTO ssh_commands (command, usage)
      VALUES (${data.command}, ${data.usage})
      RETURNING id
    `;

    return {
      statusCode:200,
      body:JSON.stringify({id:result[0].id})
    };
  }

  if(method === "PUT"){
    await sql`
      UPDATE ssh_commands
      SET command=${data.command},
          usage=${data.usage}
      WHERE id=${data.id}
    `;
    return {statusCode:200};
  }

  if(method === "DELETE"){
    await sql`DELETE FROM ssh_commands WHERE id=${data.id}`;
    return {statusCode:200};
  }

};
