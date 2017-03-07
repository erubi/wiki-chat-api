const Router = require('koa-router');
const graphqlKoa = require('graphql-server-koa').graphqlKoa;
const graphqlTools = require('graphql-tools');

const router = new Router();

// based on:
// https://github.com/apollographql/GitHunt-API/blob/master/api/schema.js

const rootSchema = [`
  # Entity interface
  interface Node {
    id: ID!
  }

  type User implements Node {
    id: ID!
    name: String
    email: String
  }

  type Entity implements Node {
    id: ID!,
  }

  enum FeedType {
     # Sort by a combination of freshness and score, using Reddit's algorithm
    HOT
    # Newest entries first
    NEW
    # Highest score entries first
    TOP
  }

  type Query {
    currentUser: User

    user(id: ID!): User

    entity(id: ID!): Entity

    feed(type: FeedType!, offset: Int, limit: Int): [Entity]
  }

  enum VoteType {
    UP
    DOWN
    CANCEL
  }

  type Mutation {
    vote (entityId: Int!, type: VoteType!): Entity
  }

  schema {
    query: Query,
    mutation: Mutation
  }
`];

const rootResolvers = {
  Query: {
    // feed(root, { type, offset, limit }, context) {
    //   // Ensure API consumer can only fetch 10 items at most
    //   const protectedLimit = (limit < 1 || limit > 10) ? 10 : limit;

    //   return context.Entries.getForFeed(type, offset, protectedLimit);
    // },
    // entry(root, { repoFullName }, context) {
    //   return context.Entries.getByRepoFullName(repoFullName);
    // },
    currentUser(root, args, context) {
      return context.user || null;
    },
  }
};

router.post('/graphql', graphqlKoa({ schema: rootSchema }));

module.exports = (db) => {
  return router;
};

