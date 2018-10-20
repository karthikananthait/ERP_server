const knex = require("knex");
const config = require("./config");

export default knex({
  client: "mysql",
  connection: {
    host: config.db_host,
    user: config.db_user,
    password: config.db_password,
    database: config.db_DB,
    charset: "utf8"
  }
});
