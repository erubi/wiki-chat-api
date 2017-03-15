const Router = require('koa-router');
const graphqlKoa = require('graphql-server-koa').graphqlKoa;
const graphqlTools = require('graphql-tools');
const rootSchema = require('./schema');
const rootResolvers = require('./resolvers');

module.exports = (db) => {
  const router = new Router();

  const schema = graphqlTools.makeExecutableSchema({
    typeDefs: rootSchema,
    resolvers: rootResolvers,
    logger: { log: e => console.log('resolver error', e) },
    allowUndefinedInResolve: false,
  });

  router.post('/graphql', graphqlKoa((ctx) => {
    return {
      schema,
      context: { user: ctx.state.user, db },
      debug: true,
      formatError: (e) => {
        console.log('graphql endpoint error: ', e);
      },
    };
  }));

  return router;
};

