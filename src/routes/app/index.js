const Router = require('koa-router');
const fetch = require('../../lib/fetch');
const cheerio = require('cheerio');

const router = new Router();


module.exports = (db) => {
  router.get('/url_data', async (ctx) => {
    const { url } = ctx.query;
    if (!url) {
      ctx.status = 400;
      ctx.body = 'Missing required param - url';
      return;
    }
    let res;
    try {
      res = await fetch.get(url);
    } catch (e) {
      ctx.status = 500;
      ctx.body = 'Invalid url';
      return;
    }
    const $ = cheerio.load(res);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();

    ctx.body = { metadata: { title } };
  });

  // router.post('/news', async (ctx) => {
  //   const { url, header, body, news_source_id } = ctx.request.body;
  //   if (!url || !header || !body) {
  //     ctx.status = 400;
  //     ctx.body = 'Missing required fields';
  //     return;
  //   }
  //   let queryText;
  //   let result;

  //   const entity = await db.query('INSERT INTO entities DEFAULT VALUES RETURNING id');
  //   const entityId = entity.rows[0].id;

  //   if (news_source_id) {
  //     queryText = `INSERT INTO news_items (id, news_source_id, url, header, body) VALUES
  //   ($1, $2, $3, $4, $5) RETURNING *`;
  //     result = await db.query(queryText, [entityId, news_source_id, url, header, body]);
  //   } else {
  //     queryText = `INSERT INTO news_items (id, url, header, body) VALUES
  //   ($1, $2, $3, $4) RETURNING *`;
  //     result = await db.query(queryText, [entityId, url, header, body]);
  //   }

  //   ctx.body = result.rows[0];
  // });

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

  // router.post('/entity/vote', async (ctx) => {
  //   // upvote existing news_item if exists
  //   // else wise create news_item with upvote
  //   // send down news item id, vote counts to update user client
  //   const { entity_id, vote } = ctx.request.body;
  //   if (!entity_id || !vote) {
  //     ctx.status = 400;
  //     return;
  //   }

  //   const queryText = 'INSERT INTO entity_votes (entity_id, user_id, vote) VALUES ($1, $2, $3) RETURNING vote';
  //   const result = await db.query(queryText, [entity_id, ctx.state.user.id, vote]);
  //   ctx.body = result.rows[0];
  // });

  return router;
};

