const mysql = require("mysql2/promise");
const { config } = require("./config");

// Create Connection
async function mySql() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: config.database_user,
    password: config.database_password,
    database: config.database_name,
    connectionLimit: 10,
    waitForConnections: true,
    dateStrings: true,
  });
  return db;
}

// Pool Query Function
async function QueryDocument(query, data = null, isUpdate = false) {
  try {
    if (typeof data !== "object" && data === null) {
      throw { message: "data must be an object or null" };
    }
    if (!Array.isArray(query) && typeof query !== "string") {
      throw { message: "query must be an array or string" };
    }

    let queryFirstpart = "";
    let queryLastPart = "";
    let keys = data ? Object.keys(data).join(", ") : "";
    let values = data
      ? Object.values(data)
          .map((val) => `'${val}'`)
          .join(", ")
      : "";
    let queryString = "";

    if (Array.isArray(query)) {
      queryFirstpart = query[0];
      queryLastPart = query[1];
    } else {
      queryFirstpart = query;
    }

    const connection = await mySql();
    if (isUpdate) {
      queryString = data
        ? `${queryFirstpart} ${keys} = ${values} ${queryLastPart}`
        : `${queryFirstpart} ${queryLastPart}`;
    } else {
      queryString = data
        ? `${queryFirstpart} (${keys}) VALUES (${values}) ${queryLastPart}`
        : `${queryFirstpart} ${queryLastPart}`;
    }

    const result = await connection.execute(queryString);
    await connection.end();
    return result[0];
  } catch (error) {
    throw error;
  }
}

module.exports = { QueryDocument };
