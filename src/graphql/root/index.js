// const fetch = require('../../lib/fetch');
const _ = require('lodash');
const schema = require('./schema');

const toBase64 = str => new Buffer(str).toString('base64');

const resolvers = {
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
        if (voteData.user_vote === vote) {
          return {
            id: entityId,
            entityType,
            vote_sum: (voteData.vote_sum - voteData.user_vote),
            user_vote: null,
          };
        }
      }

      // insert new vote
      await db.query('INSERT INTO entity_votes (entity_id, user_id, vote) VALUES ($1, $2, $3) RETURNING *', [
        entityId, user.id, vote,
      ]);

      return {
        id: entityId,
        entityType,
        user_vote: vote,
        vote_sum: voteData.user_vote
          ? ((voteData.vote_sum - voteData.user_vote) + vote)
          : (voteData.vote_sum + vote),
      };
    },
  },

  Query: {
    currentUser: async (root, args, context) => {
      if (!context.user) return null;
      const res = await context.db.query('SELECT * FROM USERS u WHERE u.id = $1', [context.user.id]);
      return res.rows[0];
    },

    newsItem: async (root, { id }, { user, db }) => {
      let queryText;
      let res;
      if (user) {
        queryText = `SELECT n.*,
        extract('epoch' from e.created_at) as unix_time,
        COALESCE(sum(v.vote), 0) as vote_sum,
        (SELECT vote as user_vote FROM entity_votes v WHERE v.entity_id = n.id AND v.user_id = $2)
        FROM news_items n
        JOIN entities e ON n.id = e.id
        LEFT OUTER JOIN entity_votes v ON v.entity_id = n.id
        WHERE n.id = $1
        GROUP BY n.id, e.created_at`;

        res = await db.query(queryText, [id, user.id]);
      } else {
        queryText = `SELECT n.*,
        extract('epoch' from e.created_at) as unix_time,
        COALESCE(sum(v.vote), 0) as vote_sum
        FROM news_items n
        JOIN entities e ON n.id = e.id
        LEFT OUTER JOIN entity_votes v ON v.entity_id = n.id
        WHERE n.id = $1
        GROUP BY n.id, e.created_at`;

        res = await db.query(queryText, [id]);
      }

      if (res.rowCount) return res.rows[0];
      return null;
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
      if (obj.entityType) return obj.entityType;
      const keys = Object.keys(obj);
      if ((keys.includes('title') && keys.includes('url')) || obj.entityType === 'NewsItem') return 'NewsItem';
      if (keys.includes('name') && keys.includes('url')) return 'NewsSource';
      return null;
    },
  },
};

module.exports = { resolvers, schema };

