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

    voteOnEntity: async (root, { entityId, entityType, vote }, { db, user }) => {
      if (!user || !entityId || !entityType || !vote) return null;

      const userVoteVal = vote === 'UP' ? 1 : -1;
      const voteDataRes = await db.query(`
      SELECT CAST(COALESCE(sum(v.vote), 0) AS integer) as vote_sum,
      (SELECT vote as user_vote FROM entity_votes v WHERE v.entity_id = $1 AND v.user_id = $2)
      FROM entity_votes v
      WHERE v.entity_id = $1
      `, [entityId, user.id]);

      const voteData = voteDataRes.rows[0];

      if (voteData.user_vote) {
        // always delete old user vote if exists
        await db.query('DELETE FROM entity_votes e WHERE e.entity_id = $1 AND e.user_id = $2',
          [entityId, user.id]);

        // if vote negates previous vote, don't insert new vote, return obj here
        if (voteData.user_vote === userVoteVal) {
          return { id: entityId, vote_sum: (voteData.vote_sum - voteData.user_vote), entityType };
        }
      }

      await db.query('INSERT INTO entity_votes (entity_id, user_id, vote) VALUES ($1, $2, $3) RETURNING *', [
        entityId, user.id, userVoteVal,
      ]);

      if (voteData.user_vote) {
        return { id: entityId, vote_sum: (voteData.vote_sum - voteData.user_vote + userVoteVal), entityType };
      }

      return { id: entityId, vote_sum: (voteData.vote_sum + userVoteVal), entityType };
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

      if (!res.rowCount) return { edges: [], endCursor: '', hasNextPage: false };
      const lastObj = _.last(res.rows);
      const lastItemQuery = `SELECT extract('epoch' from created_at) as unix_time
      FROM news_items n
      JOIN entities e ON n.id = e.id
      ORDER BY e.created_at
      LIMIT 1`;
      const lastItemRes = await context.db.query(lastItemQuery);
      const hasNextPage = lastItemRes.rows[0].unix_time !== lastObj.unix_time;
      const endCursor = toBase64(lastObj.unix_time.toString());

      return { edges: res.rows, endCursor, hasNextPage };
    },

    currentUser: async (root, args, context) => {
      if (!context.user) return null;
      const res = await context.db.query('SELECT * FROM USERS u WHERE u.id = $1', [context.user.id]);
      return res.rows[0];
    },
  },

  Entities: {
    edges(obj) {
      return obj.edges;
    },

    pageInfo(obj) {
      return {
        endCursor: obj.endCursor,
        hasNextPage: obj.hasNextPage,
      };
    },
  },

  EntityEdge: {
    node(obj) {
      return obj;
    },

    cursor: async (obj) => {
      if (!obj) return '';
      return toBase64(obj.unix_time.toString());
    },
  },

  Entity: {
    __resolveType(obj) {
      const keys = Object.keys(obj);
      if ((keys.includes('title') && keys.includes('url')) || obj.entityType === 'NewsItem') return 'NewsItem';
      if (keys.includes('name') && keys.includes('url')) return 'NewsSource';
      return null;
    },
  },
};

