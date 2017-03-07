CREATE TABLE news_items (
  id integer REFERENCES entities ON DELETE CASCADE PRIMARY KEY,
  user_id integer REFERENCES users,
  news_source_id integer REFERENCES news_sources (id),
  url varchar(100) NOT NULL,
  header text NOT NULL,
  body text
);

CREATE INDEX news_items_user_id_index ON news_items (user_id);
CREATE INDEX news_items_news_source_id_index ON news_items (news_source_id);
