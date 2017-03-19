const _ = require('lodash');
// const fetch = require('../../lib/fetch');

const toBase64 = str => new Buffer(str).toString('base64');
const fromBase64 = str => new Buffer(str, 'base64').toString('ascii');

module.exports = {
  // Resolver functions signature
  // fieldName(obj, args, context, info) { result }
  Mutation: {
    submitNewsItem: async (root, { url, title }, context) => {
      if (!url || !title || !context.user) return null;
      const entity = await context.db.query('INSERT INTO entities DEFAULT VALUES RETURNING id');
      const entityId = entity.rows[0].id;

      // const archiveRes = await fetch.get('http://archive.org/wayback/available', { url });
      // console.log('archiveRes', archiveRes);
      // const archiveUrl = _.get(archiveRes, 'archived_snapshots.closest.url');

      const queryText = 'INSERT INTO news_items (id, url, title) VALUES ($1, $2, $3) RETURNING *';
      const res = await context.db.query(queryText, [entityId, url, title]);

      return res.rows[0];
    },

    voteOnEntity: async (root, { entityId, type }, { db, user }) => {
      if (!user || !entityId || !type) return null;

      const oldVoteRes = await db.query(`
      SELECT * FROM entity_votes e
      WHERE e.entity_id = $1 AND e.user_id = $2
      `, [entityId, user.id]);

      if (oldVoteRes.rowCount) {
        const oldVote = oldVoteRes.rows[0];
        await db.query('DELETE FROM entity_votes e WHERE e.entity_id = $1 AND e.user_id = $2',
          [entityId, user.id]);

        if ((oldVote.vote === -1 && type === 'DOWN') || (oldVote.vote === 1 && type === 'UP')) {
          return { id: entityId };
        }
      }

      await db.query('INSERT INTO entity_votes (entity_id, user_id, vote) VALUES ($1, $2, $3) RETURNING *', [
        entityId, user.id, ((type === 'UP') ? 1 : -1),
      ]);

      return { id: entityId };
    },
  },

  Query: {
    feed: async (root, { type = 'NEW', cursor, first = 10 }, context) => {
      let decodedCursor;
      if (cursor) decodedCursor = fromBase64(cursor);
      else decodedCursor = (new Date()).valueOf();

      let queryText;
      switch (type) {
      case ('NEW'):
      default:
        queryText = `SELECT n.id, n.title, n.url,
        extract('epoch' from e.created_at) as unix_time,
        COALESCE(sum(v.vote), 0) as vote_sum
        FROM news_items n
        JOIN entities e ON n.id = e.id
        LEFT OUTER JOIN entity_votes v ON v.entity_id = e.id
        WHERE e.created_at < to_timestamp($1)
        GROUP BY n.id, e.created_at
        ORDER BY e.created_at DESC
        LIMIT $2`;
      }

      const res = await context.db.query(queryText, [decodedCursor, first || 10]);
      return res.rows;
    },

    currentUser: async (root, args, context) => {
      if (!context.user) return null;
      const res = await context.db.query('SELECT * FROM USERS u WHERE u.id = $1', [context.user.id]);
      return res.rows[0];
    },
  },

  NewsItems: {
    edges(obj) {
      return obj;
    },

    pageInfo: async (obj, args, context) => {
      if (!obj.length) return { endCursor: '', hasNextPage: false };

      // only accurate for NEW feed type
      // TODO: should move query to feed resolver?
      const lastObj = _.last(obj);
      const queryText = `SELECT extract('epoch' from created_at)
      FROM news_items n
      JOIN entities e ON n.id = e.id
      ORDER BY e.created_at DESC
      LIMIT 1`;
      const res = await context.db.query(queryText);
      const hasNextPage = res.rows[0].created_at !== lastObj.unix_time;

      return {
        endCursor: toBase64(lastObj.unix_time.toString()),
        hasNextPage,
      };
    },
  },

  NewsItemEdge: {
    node(obj) {
      return obj;
    },

    cursor: async (obj) => {
      if (!obj) return '';
      return toBase64(obj.unix_time.toString());
    },
  },
};

