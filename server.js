const Koa = require('koa');
const jwt = require('koa-jwt');
const db = require('./db');
const requestTime = require('./src/middlewares/requestTime');
const publicRouter = require('./src/routes/public')(db);
const appRouter = require('./src/routes/app')(db);

const app = new Koa();

app.use(requestTime('Response-time'));

app.use((ctx, next) => {
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401;
      ctx.body = 'Protected resource, use Authorization header to get access\n';
    } else {
      throw err;
    }
  });
});

app.use(publicRouter.routes());

app.use(jwt({ secret: process.env.JWT_SECRET }));

app.use(appRouter.routes());

app.listen(3000);

