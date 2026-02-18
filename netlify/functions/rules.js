
const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "data", "htaccess-rules.json");

exports.handler = async (event) => {
  if(event.httpMethod === "GET"){
    const data = fs.readFileSync(file, "utf8");
    return {
      statusCode: 200,
      headers:{ "Content-Type":"application/json" },
      body: data
    };
  }

  if(event.httpMethod === "POST"){
    const body = JSON.parse(event.body || "{}");
    const { title, code } = body;

    if(!title || !code){
      return { statusCode:400, body:"Missing fields" };
    }

    const rules = JSON.parse(fs.readFileSync(file,"utf8"));
    rules.push({ title, code });

    fs.writeFileSync(file, JSON.stringify(rules,null,2));

    return {
      statusCode:200,
      body: JSON.stringify({ ok:true })
    };
  }

  return { statusCode:405 };
};
