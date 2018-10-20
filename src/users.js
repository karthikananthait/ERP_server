/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import Knex from "./knex";

const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Users = [
  // get user list
  {
    path: "/testing.mail",
    method: "get",
    config: {
      auth: {
        strategy: "token"
        // mode: "optional"
      }
    },
    handler: async request => {
      const { username } = request.auth.credentials;
      // console.log("user", username);
      let reply = null;
      const q = `SELECT u.*, (select GROUP_CONCAT(r.role) from roles r WHERE find_in_set(r.role_id,u.role)) as role_names FROM users u`;
      // console.log("s", q);
      await Knex.raw(q).then(([res]) => {
        // console.log("res", res);
        if (res) {
          reply = {
            success: true,
            data: res
          };
        } else {
          reply = {
            success: false,
            message: "Error while geting the user"
          };
        }
      });
      return reply;
    }
  },
  // login api
  {
    path: "/auth",
    method: "post",
    config: {
      auth: {
        mode: "optional"
      },
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().required()
        }
      }
    },
    handler: async request => {
      const { username, password } = request.payload;
      let reply = null;
      // console.log("a", username, password);
      //  check user exists or not

      try {
        if (
          !request.payload ||
          !request.payload.username ||
          !request.payload.password
        ) {
          reply = {
            success: false,
            messsage: "username and password are required"
          };
        } else {
          const q = `SELECT u.username, u.name, u.role, (SELECT GROUP_CONCAT(r.role) FROM roles r WHERE find_in_set(r.role_id,u.role)) as role_names, u.password,u.mobile,u.email FROM users u WHERE u.username = '${username}'`;
          // console.log("query", q);
          await Knex.raw(q).then(async ([usercount]) => {
            if (usercount.length) {
              await bcrypt
                .compare(password, usercount[0].password)
                .then(async res => {
                  if (!res) {
                    reply = {
                      success: false,
                      messsage: "Incorrect password"
                    };
                  }
                  if (res) {
                    const token = jwt.sign(
                      {
                        username: usercount[0].username
                      },
                      "vZiYpmTzqXMp8PpYXKwqc9ShQ1UhyAfy",
                      {
                        algorithm: "HS256"
                      }
                    );
                    reply = {
                      success: true,
                      token,
                      data: usercount[0]
                    };
                  }
                });
            } else {
              reply = {
                success: false,
                messsage: "Incorrect username"
              };
            }
          });
        }
      } catch (error) {
        console.log(error, "eror");
      }

      return reply;
    }
  },

  // login api default for feeder and picker
  {
    path: "/auth/default",
    method: "post",
    config: {
      auth: {
        mode: "optional"
      },
      validate: {
        payload: {
          username: Joi.string().required() // feeder/ picker
        }
      }
    },
    handler: async request => {
      const { username } = request.payload;
      let reply = null;
      //  check user exists or not

      const q = `SELECT u.username, u.name, u.role, (SELECT GROUP_CONCAT(r.role) FROM roles r WHERE find_in_set(r.role_id,u.role)) as role_names, u.password,u.mobile,u.email FROM users u WHERE u.username = '${username}'`;
      // console.log("query", q);
      await Knex.raw(q).then(async ([usercount]) => {
        if (usercount.length) {
          const token = jwt.sign(
            {
              username: usercount[0].username
            },
            "vZiYpmTzqXMp8PpYXKwqc9ShQ1UhyAfy",
            {
              algorithm: "HS256"
            }
          );
          reply = {
            success: true,
            token,
            data: usercount[0]
          };
        } else {
          reply = {
            success: false,
            messsage: "Incorrect username"
          };
        }
      });
      return reply;
    }
  },

  // add user
  {
    path: "/users",
    method: "post",
    config: {
      auth: {
        strategy: "token"
        // mode: "optional"
      },
      validate: {
        payload: {
          username: Joi.string().required(),
          name: Joi.string().required(),
          email: Joi.string().required(),
          mobile: Joi.string().required(),
          role: Joi.string().required(),
          status: Joi.number().required()
        }
      }
    },
    handler: async request => {
      const { username, name, email, mobile, role, status } = request.payload;

      // const password = "1234";
      const password = Math.random()
        .toString(36)
        .substring(7);

      let reply = null;
      console.log("users", request.auth.credentials.username);

      // check if user exsits or not
      const q = `SELECT count(*) as ct FROM users WHERE username = '${username}'`;
      // console.log("qq", q);
      await Knex.raw(q).then(async ([user]) => {
        if (user[0].ct !== 0) {
          reply = {
            success: false,
            messsage: "User already register with same user name"
          };
        } else {
          // console.log("d");

          const hash = bcrypt.hashSync(password, 10);
          await Knex("users")
            .insert({
              username,
              password: hash,
              name,
              email,
              mobile,
              role,
              status
            })
            .then(async res => {
              await Knex.raw(
                "SELECT GROUP_CONCAT(u.email) as email FROM users u WHERE find_in_set((select group_concat(r.role_id) from roles  r where r.role = 'Super Admin' ),u.role)"
              ).then(async ([res2]) => {
                if (res2.length) {
                  const tomail = res2[0].email;
                  mail(
                    `New Password for User - ${username} is ${password}`,
                    "testmail@akrivia.in",
                    tomail,
                    null,
                    `New Password for User - ${username}`,
                    null
                  );
                }

                reply = {
                  success: true,
                  message: "User added successfully"
                };
              });
            });
        }
      });

      return reply;
    }
  },

  // get user list
  {
    path: "/users",
    method: "get",
    config: {
      auth: {
        strategy: "token"
        // mode: "optional"
      }
    },
    handler: async request => {
      const { username } = request.auth.credentials;
      // console.log("user", username);
      let reply = null;
      const q = `SELECT u.*, (select GROUP_CONCAT(r.role) from roles r WHERE find_in_set(r.role_id,u.role)) as role_names FROM users u`;
      // console.log("s", q);
      await Knex.raw(q).then(([res]) => {
        // console.log("res", res);
        if (res) {
          reply = {
            success: true,
            data: res
          };
        } else {
          reply = {
            success: false,
            message: "Error while geting the user"
          };
        }
      });
      return reply;
    }
  },

  // update user details
  {
    path: "/update/user/details",
    method: "post",
    config: {
      auth: {
        strategy: "token"
        // mode: "optional"
      },
      validate: {
        payload: {
          uid: Joi.string().required(),
          username: Joi.string().required(),
          name: Joi.string().required(),
          email: Joi.string().required(),
          mobile: Joi.string().required(),
          role: Joi.string().required(),
          status: Joi.number().required()
        }
      }
    },
    handler: async request => {
      const {
        uid,
        username,
        name,
        email,
        mobile,
        role,
        status
      } = request.payload;

      let reply = null;
      // console.log("users", request.auth.credentials.username);

      await Knex("users")
        .where("uid", "=", uid)
        .update({
          username,
          name,
          email,
          mobile,
          role,
          status
        })
        .then(res => {
          reply = {
            success: true,
            message: "Updated successfully"
          };
        });

      return reply;
    }
  },
  // forgot password
  {
    path: "/forgot/password",
    method: "post",
    config: {
      auth: {
        // strategy: "token"
        mode: "optional"
      },
      validate: {
        payload: {
          username: Joi.string().required()
        }
      }
    },
    handler: async request => {
      const { username } = request.payload;

      let reply = null;
      // console.log("users", request.auth.credentials.username);
      // const password = "12345";
      const password = Math.random()
        .toString(36)
        .substring(7);
      // console.log("random", r);
      const hash = bcrypt.hashSync(password, 10);
      await Knex("users")
        .where("username", "=", username)
        .update({
          password: hash
        })
        .then(async res => {
          await Knex.raw(
            "SELECT GROUP_CONCAT(u.email) as email FROM users u WHERE find_in_set((select group_concat(r.role_id) from roles  r where r.role = 'Super Admin' ),u.role)"
          ).then(async ([res2]) => {
            if (res2.length) {
              const tomail = res2[0].email;
              mail(
                `New Password for User - ${username} is ${password}`,
                "testmail@akrivia.in",
                tomail,
                null,
                `Reset Password for User - ${username}`,
                null
              );
            }

            reply = {
              success: true,
              message: "Successfully generated new password"
            };
          });
        });

      return reply;
    }
  },
  // Change password
  {
    path: "/change/password",
    method: "post",
    config: {
      auth: {
        strategy: "token"
        // mode: "optional"
      },
      validate: {
        payload: {
          // username: Joi.string().required(),
          currentPassword: Joi.string().required(),
          newPassword: Joi.string().required()
        }
      }
    },
    handler: async request => {
      const { currentPassword, newPassword } = request.payload;
      const { username } = request.auth.credentials;

      let rs = null;
      // console.log("users", request.auth.credentials.username);
      // const password = "1234";

      await Knex.raw(`SELECT * FROM users u WHERE u.username = '${username}'`)
        .then(async ([result1]) => {
          if (result1.length) {
            await bcrypt
              .compare(currentPassword, result1[0].password)
              .then(async res => {
                if (!res) {
                  rs = {
                    success: false,
                    messsage: "Incorrect password"
                  };
                }
                if (res) {
                  const hash = bcrypt.hashSync(newPassword, 10);
                  await Knex("users")
                    .where("username", "=", username)
                    .update({
                      password: hash
                    })
                    .then(res2 => {
                      rs = {
                        success: true,
                        message: "Successfully changed your password",
                        data: null
                      };
                    })
                    .catch(err => {
                      // reply(`server-side error${err}`);
                      rs = {
                        success: false,
                        message: err,
                        data: null
                      };
                    });
                }
              })
              .catch(err => {
                // reply(`server-side error${err}`);
                rs = {
                  success: false,
                  message: err,
                  data: null
                };
              });
          } else {
            rs = {
              success: false,
              message: "Incorrect password",
              data: null
            };
          }
        })
        .catch(err => {
          // reply(`server-side error${err}`);
          rs = {
            success: false,
            message: err,
            data: null
          };
        });

      return rs;
    }
  },

  // get config list
  {
    path: "/get/config/data",
    method: "get",
    config: {
      auth: {
        strategy: "token"
        // mode: "optional"
      }
    },
    handler: async request => {
      const { username } = request.auth.credentials;
      // console.log("user", username);
      let reply = null;
      const q = `SELECT * FROM config`;
      // console.log("s", q);
      await Knex.raw(q).then(([res]) => {
        // console.log("res", res);
        if (res) {
          reply = {
            success: true,
            message: "Success",
            data: res
          };
        } else {
          reply = {
            success: false,
            message: "Error while geting the data",
            data: null
          };
        }
      });
      return reply;
    }
  },

  // update config data
  {
    path: "/update/config/data",
    method: "post",
    config: {
      auth: {
        // strategy: "token"
        mode: "optional"
      },
      validate: {
        payload: {
          data: Joi.required()
        }
      }
    },
    handler: async request => {
      const { data } = request.payload;

      let reply = null;
      // console.log("users", request.auth.credentials.username);
      // const password = "12345";

      await data.forEach(async row => {
        await Knex("config")
          .where("config_type", "=", row.config_type)
          .update({
            value: row.value
          })
          .then(async res => {});
      });

      reply = await {
        success: true,
        message: "Successfully Updated",
        data: null
      };
      return reply;
    }
  }
];
export default Users;
