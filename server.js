const Koa = require('koa');
const jwt = require('koa-jwt');
const koaBody = require('koa-body');
const _ = require('lodash');
const db = require('./db');
const requestTime = require('./src/middlewares/requestTime');
const publicRouter = require('./src/routes/public')(db);
const appRouter = require('./src/routes/app')(db);

const app = new Koa();

app.use(requestTime('Response-time'));

app.use((ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', 'http://localhost:3001');
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401;
      ctx.body = 'Protected resource, use Authorization header to get access\n';
    } else {
      throw err;
    }
  });
});

app.use(koaBody());

app.use(publicRouter.routes());

app.use(jwt({
  secret: process.env.JWT_SECRET,
  // TODO: handle token expiration?
  isRevoked: (ctx, user) => {
    if (!user.id) return Promise.resolve(true);
    return db.query('SELECT * FROM USERS u WHERE u.id = $1', [user.id])
    .then((res) => {
      if (!(_.get(res, 'rows.length'))) return Promise.resolve(true);
      return Promise.resolve(false);
    });
  },
}));

app.use(appRouter.routes());

app.listen(3000);

