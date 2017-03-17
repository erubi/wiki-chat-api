// const _ = require('lodash');
// const fetch = require('../../lib/fetch');

const toBase64 = (str) => {
  return new Buffer(str).toString('base64');
}

const fromBase64 = (str) => {
  return new Buffer(str, 'base64').toString('ascii');
}

module.exports = {
  // Resolver functions signature
  // fieldName(obj, args, context, info) { result }
  Query: {
    // feed: async (root, { type, offset = 0, limit = 10 }, context) => {
    //   const protectedLimit = (limit < 1 || limit > 10) ? 10 : limit;
    //   const queryText = 'SELECT * FROM news_items n
    //   JOIN entities e ON n.id = e.id ORDER BY e.created_at LIMIT $1 OFFSET $2';
    //   const res = await context.db.query(queryText, [protectedLimit, offset]);
    //   return res.rows;
    // },
    feed: async (root, { type = 'NEW', cursor = '', first = 10 }, context) => {
      let decodedCursor;
      if (cursor.length) decodedCursor = fromBase64(cursor);
      else decodedCursor = (new Date()).valueOf();

      let queryText;
      switch (type) {
      case ('NEW'):
      default:
        queryText = `SELECT * FROM news_items n
        JOIN entities e ON n.id = e.id
        WHERE e.created_at < to_timestamp($1)
        ORDER BY e.created_at
        LIMIT $2`;
      }

      const res = await context.db.query(queryText, [decodedCursor, first]);
      return res.rows;
      // return {
        // cursor: toBase64(_.last(res.rows).created_at),
        // entities: res.rows,
      // };
    },

    currentUser: async (root, args, context) => {
      if (!context.user) return null;
      const res = await context.db.query('SELECT * FROM USERS u WHERE u.id = $1', [context.user.id]);
      return res.rows[0];
    },
  },

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
  },

  NewsItems: {
    edges(obj) {
      return obj;
    },
  },

  NewsItemEdge: {
    node(obj) {
      return obj;
    },

    cursor(obj) {
      return toBase64(obj.created_at.valueOf().toString());
    },
  },
};

