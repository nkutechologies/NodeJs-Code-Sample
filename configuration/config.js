const util = require("util");
const mysql = require("mysql");
let pool = "";

pool = mysql.createPool({
  connectionLimit: 0,
  host: "localhost",
  user: "cnam",
  password: "#XIFHH5HYrLc9T$W",
  database: "cnam",
});
//Ping database to check for common exception errors.
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection was refused.");
    }
  }

  if (connection) connection.release();

  return;
});

// Promisify for Node.js async/await.
pool.query = util.promisify(pool.query);

module.exports = pool;



