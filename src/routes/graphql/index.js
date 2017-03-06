const Router = require('koa-router');
const graphqlKoa = require('graphql-server-koa').graphqlKoa;

const router = new Router();

router.post('/graphql', graphqlKoa({ schema: graphqlSchema }));
