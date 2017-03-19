// based on:
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

    feed(type: FeedType, cursor: String, first: Int): Entities
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

module.exports = rootSchema;

