const Router = require('koa-router');
// const fetch = require('../../lib/fetch');

const router = new Router();

module.exports = (db) => {
  // router.get('/', async (ctx) => {
  //   const result = await db.query('SELECT NOW()');
  //   ctx.body = result.rows[0].now.toISOString();
  // });

  router.post('/news', async (ctx) => {
    const { url, header, body, news_source_id } = ctx.request.body;
    if (!url || !header || !body) {
      ctx.status = 400;
      ctx.body = 'Missing required fields';
      return;
    }
    let queryText;
    let result;

    const entity = await db.query('INSERT INTO entities DEFAULT VALUES RETURNING id');
    const entityId = entity.rows[0].id;

    if (news_source_id) {
      queryText = `INSERT INTO news_items (id, news_source_id, url, header, body) VALUES
    ($1, $2, $3, $4, $5) RETURNING *`;
      result = await db.query(queryText, [entityId, news_source_id, url, header, body]);
    } else {
      queryText = `INSERT INTO news_items (id, url, header, body) VALUES
    ($1, $2, $3, $4) RETURNING *`;
      result = await db.query(queryText, [entityId, url, header, body]);
    }

    ctx.body = result.rows[0];
  });

  router.post('/entity/vote', async (ctx) => {
    // upvote existing news_item if exists
    // else wise create news_item with upvote
    // send down news item id, vote counts to update user client
    const { entity_id, vote } = ctx.request.body;
    if (!entity_id || !vote) {
      ctx.status = 400;
      return;
    }

    const queryText = 'INSERT INTO entity_votes (entity_id, user_id, vote) VALUES ($1, $2, $3) RETURNING vote';
    const result = await db.query(queryText, [entity_id, ctx.state.user.id, vote]);
    ctx.body = result.rows[0];
  });

  return router;
};

