const _ = require('lodash');
const utils = require('../../lib/utils');

const schema = [`
  type EntityComment implements Entity {
    id: ID!
    entity_id: Int!
    user_id: Int!
    body: String!
    username: String!
    user_vote: Int
    vote_sum: Int
  }

  extend type Mutation {
    commentOnEntity (entityId: Int!, parentId: Int, body: String!): EntityComment
  }

  extend type Query {
    comments(entityId: ID!, cursor: String, first: Int): Entities
  }
`];

const fetchEntities = async ({ type, decodedCursor, first, entityId, db }) => {
  let queryText;
  switch (type) {
  case ('NEW'):
  default:
    queryText = `WITH RECURSIVE comments AS (
    SELECT c.*,
    e.created_at,
    (SELECT username FROM users u WHERE u.id = c.user_id),
    COALESCE(sum(v.vote), 0)::int as vote_sum
    FROM entity_comments c
    JOIN entities e ON c.id = e.id
    LEFT OUTER JOIN entity_votes v ON v.entity_id = e.id
    WHERE c.entity_id = $4 AND e.created_at > $1::timestamptz AND parent_id IS NULL
    GROUP BY c.id, e.created_at
    HAVING COALESCE(sum(v.vote), 0) <= $2
    ORDER BY vote_sum DESC, e.created_at
    LIMIT $3
    ), cte AS (
    SELECT c.*,
        array[-c.vote_sum, c.id] AS path,
        1 AS depth
    FROM comments c
    UNION ALL
    SELECT c.*,
        cte.path || -c.vote_sum || c.id,
        cte.depth + 1 AS depth
    FROM comments c
    JOIN cte ON c.parent_id = cte.id
    )
    SELECT *, 'EntityComment' as "entityType"
    FROM cte
    ORDER BY path, created_at`;
  }

  const res = await db.query(queryText, [decodedCursor.created_at, decodedCursor.vote_sum, first || 10, entityId]);
  return res;
};

const fetchEntitiesForUser = async ({ type, decodedCursor, first, user, entityId, db }) => {
  let queryText;
  switch (type) {
  case ('NEW'):
  default:
    queryText = `WITH RECURSIVE comments AS (
    SELECT c.*,
    e.created_at,
    (SELECT username FROM users u WHERE u.id = c.user_id),
    (SELECT vote as user_vote FROM entity_votes v WHERE v.entity_id = c.id AND v.user_id = $4),
    COALESCE(sum(v.vote), 0)::int as vote_sum
    FROM entity_comments c
    JOIN entities e ON c.id = e.id
    LEFT OUTER JOIN entity_votes v ON v.entity_id = e.id
    WHERE c.entity_id = $5 AND e.created_at > $1::timestamptz AND parent_id IS NULL
    GROUP BY c.id, e.created_at
    HAVING COALESCE(sum(v.vote), 0) <= $2
    ORDER BY vote_sum DESC, e.created_at
    LIMIT $3
    ), cte AS (
    SELECT c.*,
        array[-c.vote_sum, c.id] AS path,
        1 AS depth
    FROM comments c
    UNION ALL
    SELECT c.*,
        cte.path || -c.vote_sum || c.id,
        cte.depth + 1 AS depth
    FROM comments c
    JOIN cte ON c.parent_id = cte.id
    )
    SELECT *, 'EntityComment' as "entityType"
    FROM cte
    ORDER BY path, created_at`;
  }

  const res = await db.query(queryText, [decodedCursor.created_at, decodedCursor.vote_sum, first || 10, user.id, entityId]);
  return res;
};

const fetchLastItem = async ({ db, entityId }) => {
  // TODO: this has to be consistent with sorting of entity query but can still use created_at cursor
  const lastItemQuery = `SELECT e.created_at,
      COALESCE(sum(v.vote), 0)::int as vote_sum
      FROM entity_comments c
      JOIN entities e ON c.id = e.id
      LEFT OUTER JOIN entity_votes v ON v.entity_id = e.id
      WHERE c.entity_id = $1 AND c.parent_id IS NULL
      GROUP BY e.created_at
      ORDER BY vote_sum ASC, e.created_at DESC
      LIMIT 1`;

  return db.query(lastItemQuery, [entityId]);
};

const resolvers = {
  Query: {
    comments: async (root, { type = 'NEW', cursor, first = 10, entityId }, { user, db }) => {
      let decodedCursor;
      if (cursor) decodedCursor = utils.fromBase64(cursor);
      else decodedCursor = { created_at: '-infinity', vote_sum: 100000000 };
      let entitiesRes;

      if (user) entitiesRes = await fetchEntitiesForUser({ type, decodedCursor, first, user, db, entityId });
      else entitiesRes = await fetchEntities({ type, decodedCursor, first, db, entityId });

      if (!entitiesRes.rowCount) return { edges: [], endCursor: '', hasNextPage: false };
      const lastObj = _.last(entitiesRes.rows.filter(r => !r.parent_id));
      const lastItemRes = await fetchLastItem({ db, entityId });
      const hasNextPage = lastItemRes.rows[0].created_at !== lastObj.created_at
        || lastItemRes.rows[0].vote_sum !== lastObj.vote_sum;
      const endCursor = utils.toBase64({
        created_at: lastObj.created_at,
        vote_sum: lastObj.vote_sum,
      });

      return { edges: entitiesRes.rows, endCursor, hasNextPage };
    },
  },

  Mutation: {
    commentOnEntity: async (root, { entityId, parentId, body }, { db, user }) => {
      if (!user || !entityId || !body) return null;
      const entity = await db.query('INSERT INTO entities DEFAULT VALUES RETURNING id');
      const id = entity.rows[0].id;

      let queryText;
      let insertRes;
      if (parentId) {
        queryText = `INSERT INTO entity_comments (id, entity_id, parent_id, user_id, body)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        insertRes = await db.query(queryText, [id, entityId, parentId, user.id, body]);
      } else {
        queryText = `INSERT INTO entity_comments (id, entity_id, user_id, body)
        VALUES ($1, $2, $3, $4) RETURNING *`;
        insertRes = await db.query(queryText, [id, entityId, user.id, body]);
      }

      return Object.assign({}, { username: user.username }, insertRes.rows[0]);
    },
  },

  EntityComment: {
    vote_sum(obj) {
      return _.get(obj, 'vote_sum', 0);
    },

    user_vote(obj) {
      return _.get(obj, 'user_vote', null);
    },
  },
};

module.exports = { resolvers, schema };

