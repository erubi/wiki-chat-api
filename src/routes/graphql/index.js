const Router = require('koa-router');
const graphqlKoa = require('graphql-server-koa').graphqlKoa;
const graphqlTools = require('graphql-tools');
const rootSchema = require('./schema');

module.exports = (db) => {
  const router = new Router();

  const rootResolvers = {
    // Resolver functions signature
    // fieldName(obj, args, context, info) { result }
    Query: {
      feed: async (root, { type, offset = 0, limit = 10 }) => {
        const protectedLimit = (limit < 1 || limit > 10) ? 10 : limit;
        const queryText = 'SELECT * FROM news_items n JOIN entities e ON n.id = e.id ORDER BY e.created_at LIMIT $1 OFFSET $2';
        const res = await db.query(queryText, [protectedLimit, offset]);
        return res.rows;
      },
      currentUser(root, args, context) {
        return db.query('SELECT USER u WHERE u.id = $1', [context.user.id]);
      },
    },

    Mutation: {
      submitNewsItem: async (root, { url, header, body }) => {
        if (!url || !header || !body) return null;
        const entity = await db.query('INSERT INTO entities DEFAULT VALUES RETURNING id');
        const entityId = entity.rows[0].id;
        const queryText = `INSERT INTO news_items (id, url, header, body) VALUES
      ($1, $2, $3, $4) RETURNING *`;
        const res = await db.query(queryText, [entityId, url, header, body]);

        return res.rows[0];
      },
    },

    NewsItem(root, args, context) {
      debugger;
    },
  };

  const schema = graphqlTools.makeExecutableSchema({
    typeDefs: rootSchema,
    resolvers: rootResolvers,
    logger: { log: e => console.log('resolver error', e) },
    allowUndefinedInResolve: false,
  });

  router.post('/graphql', graphqlKoa((ctx) => {
    return {
      schema,
      context: { user: ctx.user },
      debug: true,
      formatError: (e) => {
        console.log('graphql endpoint error: ', e);
      },
    };
  }));

  return router;
};

// module.exports = () => {
//   return router;
// };

