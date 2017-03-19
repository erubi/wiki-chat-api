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

  type EntityVote {
    entity_id: Int!
    user_id: Int!
    vote: Int!
  }

  type User implements Node {
    id: ID!
    name: String
    email: String
    username: String
  }

  type NewsSource implements Node {
    id: ID!
    url: String!
    name: String!
  }

  type NewsItems {
    edges: [NewsItemEdge]
    pageInfo: PageInfo
  }

  type PageInfo {
    endCursor: String!
    hasNextPage: Boolean!
  }

  type NewsItemEdge {
    cursor: String
    node: NewsItem
  }

  type NewsItem implements Node {
    id: ID!
    url: String!
    title: String!
    vote_sum: Int!,
    userVote: EntityVote
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

    feed(type: FeedType, cursor: String, first: Int): NewsItems
  }

  enum VoteType {
    UP
    DOWN
  }

  type Mutation {
    submitNewsItem (
      url: String!,
      title: String!,
      author: String,
      publisher: String,
      news_source_id: Int
    ): NewsItem

    voteOnEntity (entityId: Int!, type: VoteType!): Entity
  }

  schema {
    query: Query,
    mutation: Mutation
  }
`];

module.exports = rootSchema;

