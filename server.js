const Koa = require('koa');
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
app.use(ctx => {
  // console.log(ctx);
  ctx.body = 'Hello Koa';
});

app.listen(3000);
