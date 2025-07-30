require("dotenv").config();

const config = {
  api_prefix: process.env.API_PREFIX,
  ws_prefix: process.env.WS_PREFIX,
  port: process.env.PORT,
  node_env: process.env.NODE_ENV,
  database_name: process.env.DATABASE_NAME,
  database_user: process.env.DATABASE_USER,
  database_password: process.env.DATABASE_PASSWORD,
};

module.exports = { config };
