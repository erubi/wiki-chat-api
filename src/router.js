const Router = require('koa-router');
const koaBody = require('koa-body')();

const router = new Router();

module.exports = (db) => {
  router.get('/', async (ctx) => {
    const result = await db.query('SELECT NOW()');
    ctx.body = result.rows[0].now.toISOString();
  });

  router.post('/users', koaBody, async (ctx) => {
    const { username, password, email } = ctx.request.body;
    if (!username || !password || !email) {
      ctx.status = 400;
      return;
    }

    const queryText = `INSERT INTO users (username, email, password) VALUES
    ($1, $2, crypt('${password}', gen_salt('bf', 8))) RETURNING id`;

    try {
      await db.query(queryText, [username, email]);
    } catch (err) {
      console.error('POST /users err: ', err);
    }
    // const userId = result.rows[0].id;
  });

  return router;
};
