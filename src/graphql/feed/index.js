const _ = require('lodash');

const toBase64 = str => new Buffer(str).toString('base64');
const fromBase64 = str => new Buffer(str, 'base64').toString('ascii');

const schema = [`
  enum FeedType {
     # Sort by a combination of freshness and score, using Reddit's algorithm
    HOT
    # Newest entries first
    NEW
    # Highest score entries first
    TOP
  }

  extend type Query {
    feed(type: FeedType, cursor: String, first: Int): Entities
  }
`];

const fetchEntities = async ({ type, decodedCursor, first, db }) => {
  let queryText;
  switch (type) {
  case ('NEW'):
  default:
    queryText = `SELECT n.id, n.title, n.url, e.created_at,
      COALESCE(sum(v.vote), 0) as vote_sum
      FROM news_items n
      JOIN entities e ON n.id = e.id
      LEFT OUTER JOIN entity_votes v ON v.entity_id = e.id
      WHERE e.created_at < $1
      GROUP BY n.id, e.created_at
      ORDER BY e.created_at DESC
      LIMIT $2`;
  }

  const res = await db.query(queryText, [decodedCursor, first || 10]);
  return res;
};

const fetchEntitiesForUser = async ({ type, decodedCursor, first, user, db }) => {
  let queryText;
  switch (type) {
  case ('NEW'):
  default:
    queryText = `SELECT n.id, n.title, n.url, e.created_at,
      COALESCE(sum(v.vote), 0) as vote_sum,
      (SELECT vote as user_vote FROM entity_votes v WHERE v.entity_id = n.id AND v.user_id = $3)
      FROM news_items n
      JOIN entities e ON n.id = e.id
      LEFT OUTER JOIN entity_votes v ON v.entity_id = e.id
      WHERE e.created_at < $1
      GROUP BY n.id, e.created_at
      ORDER BY e.created_at DESC
      LIMIT $2`;
  }

  const res = await db.query(queryText, [decodedCursor, first || 10, user.id]);
  return res;
};

const resolvers = {
  Query: {
    feed: async (root, { type = 'NEW', cursor, first = 10 }, { user, db }) => {
      let decodedCursor;
      if (cursor) decodedCursor = fromBase64(cursor);
      else decodedCursor = (new Date().toJSON());
      let entitiesRes;

      if (user) entitiesRes = await fetchEntitiesForUser({ type, decodedCursor, first, user, db });
      else entitiesRes = await fetchEntities({ type, decodedCursor, first, db });

      if (!entitiesRes.rowCount) return { edges: [], endCursor: '', hasNextPage: false };
      const lastObj = _.last(entitiesRes.rows);
      const lastItemQuery = `SELECT e.created_at
      FROM news_items n
      JOIN entities e ON n.id = e.id
      ORDER BY e.created_at
      LIMIT 1`;
      const lastItemRes = await db.query(lastItemQuery);
      const hasNextPage = lastItemRes.rows[0].created_at.toJSON() !== lastObj.created_at.toJSON();
      const endCursor = toBase64(lastObj.created_at.toJSON());

      return { edges: entitiesRes.rows, endCursor, hasNextPage };
    },
  },
};

module.exports = { resolvers, schema };

