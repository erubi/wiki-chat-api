const Router = require('koa-router');

const router = new Router();

module.exports = (db) => {
  router.get('/', async (ctx) => {
    const result = await db.query('SELECT NOW()');
    ctx.body = result.rows[0].now.toISOString();
  });

  return router;
};
