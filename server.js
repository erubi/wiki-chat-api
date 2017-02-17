const Koa = require('koa');
const db = require('./db');

const app = new Koa();

function requestTime(headerName) {
  return async (ctx, next) => {
    const start = new Date();
    await next();
    const end = new Date();
    const ms = end - start;
    ctx.set(headerName, `${ms}ms`);
  };
}

app.use(requestTime('Response-time'));

// response
app.use(async (ctx) => {
  const result = await db.query('SELECT NOW()');
  ctx.body = result.rows[0].now.toISOString()
});

app.listen(3000);
