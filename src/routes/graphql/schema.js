// based on:
// https://github.com/apollographql/GitHunt-API/blob/master/api/schema.js

const rootSchema = [`
  # Entity interface
  interface Node {
    id: ID!
  }

  type Entity implements Node {
    id: ID!
  }

  type User implements Node {
    id: ID!
    name: String
    email: String
  }

  type NewsSource implements Node {
    id: ID!
    url: String!
    name: String!
  }

  type NewsItem implements Node {
    id: ID!
    url: String!
    newsSource: NewsSource
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

    feed(type: FeedType, offset: Int, limit: Int): [NewsItem]
  }

  enum VoteType {
    UP
    DOWN
    CANCEL
  }

  type Mutation {
    submitNewsItem (
      url: String!,
      author: String,
      publisher: String,
      news_source_id: Int,
    ): NewsItem

    vote (entityId: Int!, type: VoteType!): Entity
  }

  schema {
    query: Query,
    mutation: Mutation
  }
`];

module.exports = rootSchema;

