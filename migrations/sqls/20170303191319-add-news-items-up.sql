CREATE TABLE news_items (
  id integer REFERENCES entities ON DELETE CASCADE PRIMARY KEY,
  user_id integer REFERENCES users,
  news_source_id integer REFERENCES news_sources (id),
  url varchar(100) UNIQUE NOT NULL,
  author varchar(100),
  publisher varchar(100),
  published_at timestamp,
  archive_url varchar(100) UNIQUE,
  archived_at timestamp
);

CREATE INDEX news_items_user_id_index ON news_items (user_id);
CREATE INDEX news_items_news_source_id_index ON news_items (news_source_id);
