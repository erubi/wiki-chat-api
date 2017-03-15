module.exports = {
  // Resolver functions signature
  // fieldName(obj, args, context, info) { result }
  Query: {
    feed: async (root, { type, offset = 0, limit = 10 }, context) => {
      const protectedLimit = (limit < 1 || limit > 10) ? 10 : limit;
      const queryText = 'SELECT * FROM news_items n JOIN entities e ON n.id = e.id ORDER BY e.created_at LIMIT $1 OFFSET $2';
      const res = await context.db.query(queryText, [protectedLimit, offset]);
      return res.rows;
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
      const queryText = 'INSERT INTO news_items (id, url, title) VALUES ($1, $2, $3) RETURNING *';
      const res = await context.db.query(queryText, [entityId, url, title]);

      return res.rows[0];
    },
  },

  NewsItem(root, args, context) {
    debugger;
  },
};

