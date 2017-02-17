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
    }
  });

  return router;
};
