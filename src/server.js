/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
// import socketsConfig from "./communication";

import jwt from "jsonwebtoken";
import Users from "./users";

// communication
const Inert = require("inert");
const Hapi = require("hapi");
const AuthBearer = require("hapi-auth-bearer-token");
const config = require("./config");
const server = Hapi.server({
    host: config.host,
    port: config.server_port,
    routes: {
    cors: {
      origin: ["*"]
    }
  }
});


// Add the route

init();

async function init() {
  console.log("server init");
  await server.register([AuthBearer, Inert]);

  await server.auth.strategy("token", "bearer-access-token", {
    validate: async (request, token) => {
      let isValid;
      let credentials = {};
      await jwt.verify(token, config.token, (err, decoded) => {
        if (err) {
          isValid = false;
        } else {
          isValid = true;
          credentials = decoded;
        }
      });

      return {
        isValid,
        credentials
      };
    }
  });

  server.auth.default("token");

  // Routes
  const allRoutes = [
    ...Users
  ];
  allRoutes.forEach(item => {
    server.route(item);
  });

  await start();
}

// Start the server
async function start() {
  console.log("server start");
  try {
    await server.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  console.log("Normal Server running at:", server.info.uri);
}
