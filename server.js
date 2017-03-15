const Koa = require('koa');
const jwt = require('koa-jwt');
const koaBody = require('koa-body');
const _ = require('lodash');
const cors = require('kcors');
const db = require('./db');
const requestTime = require('./src/middlewares/requestTime');
const userRouter = require('./src/routes/user')(db);
const appRouter = require('./src/routes/app')(db);
const graphqlRouter = require('./src/routes/graphql')(db);

const app = new Koa();

app.use(requestTime('Response-time'));
app.use(cors());

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

app.use(koaBody());

app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

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
  passthrough: true,
}));

app.use(graphqlRouter.routes());
app.use(graphqlRouter.allowedMethods());
app.use(appRouter.routes());
app.use(appRouter.allowedMethods());

app.listen(3000);

