const schema = [`
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

  type EntityComment {
    id: ID!
    entity_id: Int!
    user_id: Int!
    body: String!
    parent_id: Int
    user_vote: Int
    vote_sum: Int
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
    comments: [EntityComment]
  }

  type Query {
    currentUser: User

    user(id: ID!): User

    entity(id: ID!): Entity

    newsItem(id: ID!): NewsItem
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

    commentOnEntity (entityId: Int!, parentId: Int, entityType: EntityType!, body: String!): EntityComment
  }

  schema {
    query: Query,
    mutation: Mutation
  }
`];

module.exports = schema;
