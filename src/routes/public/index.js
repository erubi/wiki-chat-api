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
      // ctx.body = _.pick(result.rows[0], ['id', 'email', 'username']);
      ctx.body = {
        token: jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET),
        message: 'Successfully logged in',
      };
    } catch (err) {
      console.error('POST /users err: ', err);
      ctx.status = 400;
    }
  });

  router.post('/login', async (ctx) => {
    const { userLogin, password } = ctx.request.body;
    if (!userLogin || !password) {
      ctx.status = 400;
      ctx.body = 'Username or email and password required';
      return;
    }

    const queryText = `SELECT * FROM users
    WHERE (email = lower('${userLogin}') OR username = lower('${userLogin}'))
    AND password = crypt('${password}', password)`;

    let result;
    try {
      result = await db.query(queryText);
      if (!(_.get(result, 'rows.length'))) throw new Error();
      ctx.body = {
        token: jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET),
        user: result.rows[0],
      };
    } catch (err) {
      console.error('POST /users err: ', err);
      ctx.status = 400;
      ctx.body = { err: { message: 'Invalid email/username or password' } };
    }
  });

  // router.redirect('/news', '/news/recent');
  // // query for news by type, default to recent
  // // send down news items from newsapi.org combined with news items in db
  // // should be unique on url
  // router.get('/news/:type', async (ctx) => {
  //   const { limit = 10, type } = ctx.params
  //   let queryText;
  //   // let freshNews = [];

  //   switch (type) {
  //   case ('hot'):
  //     queryText = 'SELECT * FROM news_items n JOIN entities e ON n.id = e.id ORDER BY e.created_at';
  //     break;
  //   case ('recent'):
  //   default:
  //     queryText = 'SELECT * FROM news_items n JOIN entities e ON n.id = e.id ORDER BY e.created_at';
  //   }
  //   const result = await db.query(queryText);
  //   // if (result.rows.length < limit) {
  //   //   freshNews = newsSources.getFresh(result.rows.length - 10)
  //   // }
  //   ctx.body = result.rows;
  // });

  // router.get('/news_source/:id', async (ctx) => {
  //   let queryText;
  //   queryText = 'SELECT * FROM news_sources n WHERE n.id = $1';
  //   const result = await db.query(queryText, ctx.params.id);
  //   ctx.body = result.rows;
  // });

  return router;
};

