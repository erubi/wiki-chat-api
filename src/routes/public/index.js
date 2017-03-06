const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const router = new Router();

module.exports = (db) => {
  router.post('/users', async (ctx) => {
    const { username, password, email } = ctx.request.body;
    if (!username || !password || !email) {
      ctx.status = 400;
      return;
    }

    const queryText = `INSERT INTO users (username, email, password) VALUES
    ($1, $2, crypt('${password}', gen_salt('bf', 8))) RETURNING id`;

    let result;
    try {
      result = await db.query(queryText, [username, email]);
      ctx.body = _.pick(result.rows[0], ['id', 'email', 'username']);
    } catch (err) {
      console.error('POST /users err: ', err);
      ctx.status = 400;
    }
  });

  router.post('/login', async (ctx) => {
    const { username, password, email } = ctx.request.body;
    if (!(username || email) || !password) {
      ctx.status = 400;
      ctx.body = 'Username or email and password required';
      return;
    }

    let queryText;
    if (email) {
      queryText = `SELECT * FROM users WHERE email = lower('${email}') AND
    password = crypt('${password}', password)`;
    } else {
      queryText = `SELECT * FROM users WHERE username= lower('${username}') AND
    password = crypt('${password}', password)`;
    }

    let result;
    try {
      result = await db.query(queryText);
      if (!(_.get(result, 'rows.length'))) throw new Error();
      ctx.body = {
        token: jwt.sign({ role: 'admin' }, process.env.JWT_SECRET),
        message: 'Successfully logged in',
      };
    } catch (err) {
      console.error('POST /users err: ', err);
      ctx.status = 400;
      ctx.body = 'Invalid username/email/password';
    }
  });

  return router;
};

