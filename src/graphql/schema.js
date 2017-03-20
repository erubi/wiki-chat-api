const _ = require('lodash');
const graphqlTools = require('graphql-tools');
const feed = require('./feed');
const root = require('./root');
// https://github.com/apollographql/GitHunt-API/blob/master/api/schema.js

const schema = graphqlTools.makeExecutableSchema({
  typeDefs: [...root.schema, ...feed.schema],
  resolvers: _.merge(root.resolvers, feed.resolvers),
  logger: { log: e => console.error('resolver error', e) },
  allowUndefinedInResolve: false,
});

module.exports = schema;

