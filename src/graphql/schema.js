const _ = require('lodash');
const graphqlTools = require('graphql-tools');
const feed = require('./feed');
const rootResolvers = require('./resolvers');
// https://github.com/apollographql/GitHunt-API/blob/master/api/schema.js

const rootSchema = [`
  # Entity interface
  interface Node {
    id: ID!
  }

  enum EntityType {
    NewsItem
    NewsSource
    Comment
  }

  interface Entity {
    id: ID!
    vote_sum: Int
    user_vote: Int
  }

  type EntityVote {
    entity_id: Int!
    user_id: Int!
    vote: Int!
  }

  type Entities {
    edges: [EntityEdge]
    pageInfo: PageInfo
  }

  type PageInfo {
    endCursor: String!
    hasNextPage: Boolean!
  }

  type EntityEdge {
    cursor: String
    node: Entity
  }

  type User implements Node {
    id: ID!
    name: String
    email: String
    username: String
  }

  type NewsSource implements Entity {
    id: ID!
    url: String!
    name: String!
    vote_sum: Int!
    user_vote: Int
  }

  type NewsItem implements Entity {
    id: ID!
    url: String!
    title: String!
    vote_sum: Int!
    user_vote: Int
    newsSource: NewsSource
  }

  type Query {
    currentUser: User

    user(id: ID!): User

    entity(id: ID!): Entity
  }

  type Mutation {
    submitNewsItem (
      url: String!,
      title: String!,
      author: String,
      publisher: String,
      news_source_id: Int
    ): NewsItem

    voteOnEntity (entityId: Int!, entityType: EntityType!, vote: Int!): Entity
  }

  schema {
    query: Query,
    mutation: Mutation
  }
`];

const schema = graphqlTools.makeExecutableSchema({
  typeDefs: [...rootSchema, ...feed.schema],
  resolvers: _.merge(rootResolvers, feed.resolvers),
  logger: { log: e => console.error('resolver error', e) },
  allowUndefinedInResolve: false,
});

module.exports = schema;

