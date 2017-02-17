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

// app.use(async function (ctx, next) {
//   const res = await db.query('SELECT NOW()');
//   console.log(res.rows[0]);
//   await next();
// });

// response
app.use(ctx => {
  ctx.body = 'Hello Koa';
});

app.listen(3000);
