const Router = require('koa-router');
const graphqlKoa = require('graphql-server-koa').graphqlKoa;
const schema = require('../../graphql');

module.exports = (db) => {
  const router = new Router();

  router.post('/graphql', graphqlKoa((ctx) => {
    return {
      schema,
      context: { user: ctx.state.user, db },
      debug: true,
      formatError: (e) => {
        console.log('graphql endpoint error: ', e);
        return e;
      },
    };
  }));

  return router;
};

