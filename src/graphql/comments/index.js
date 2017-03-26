const _ = require('lodash');

const toBase64 = str => new Buffer(str).toString('base64');
const fromBase64 = str => new Buffer(str, 'base64').toString('ascii');

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

const fetchEntities = async ({ type, decodedCursor, first, db }) => {
  let queryText;
  switch (type) {
  case ('NEW'):
  default:
    queryText = `SELECT c.*, e.created_at,
    'EntityComment' as "entityType",
    COALESCE(sum(v.vote), 0) as vote_sum,
    (SELECT username FROM users u WHERE u.id = c.user_id),
    FROM entity_comments c
    JOIN entities e ON c.id = e.id
    LEFT OUTER JOIN entity_votes v ON v.entity_id = e.id
    WHERE c.entity_id = $4 AND e.created_at < $1
    GROUP BY c.id, e.created_at
    ORDER BY e.created_at DESC
    LIMIT $2`;
  }

  const res = await db.query(queryText, [decodedCursor, first || 10]);
  return res;
};

const fetchEntitiesForUser = async ({ type, decodedCursor, first, user, entityId, db }) => {
  let queryText;
  switch (type) {
  case ('NEW'):
  default:
    queryText = `SELECT c.*, e.created_at,
    'EntityComment' as "entityType",
    COALESCE(sum(v.vote), 0) as vote_sum,
    (SELECT username FROM users u WHERE u.id = c.user_id),
    (SELECT vote as user_vote FROM entity_votes v WHERE v.entity_id = c.id AND v.user_id = $3)
    FROM entity_comments c
    JOIN entities e ON c.id = e.id
    LEFT OUTER JOIN entity_votes v ON v.entity_id = e.id
    WHERE c.entity_id = $4 AND e.created_at < $1
    GROUP BY c.id, e.created_at
    ORDER BY e.created_at DESC
    LIMIT $2`;
  }

  const res = await db.query(queryText, [decodedCursor, first || 10, user.id, entityId]);
  return res;
};

const resolvers = {
  Query: {
    comments: async (root, { type = 'NEW', cursor, first = 10, entityId }, { user, db }) => {
      let decodedCursor;
      if (cursor) decodedCursor = fromBase64(cursor);
      else decodedCursor = (new Date().toJSON());
      let entitiesRes;

      if (user) entitiesRes = await fetchEntitiesForUser({ type, decodedCursor, first, user, db, entityId });
      else entitiesRes = await fetchEntities({ type, decodedCursor, first, db, entityId });

      if (!entitiesRes.rowCount) return { edges: [], endCursor: '', hasNextPage: false };
      const lastObj = _.last(entitiesRes.rows);
      const lastItemQuery = `SELECT e.created_at
      FROM entity_comments c
      JOIN entities e ON c.id = e.id
      WHERE c.entity_id = $1
      ORDER BY e.created_at
      LIMIT 1`;
      const lastItemRes = await db.query(lastItemQuery, [entityId]);
      const hasNextPage = lastItemRes.rows[0].created_at.toJSON() !== lastObj.created_at.toJSON();
      const endCursor = toBase64(lastObj.created_at.toJSON());

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

