CREATE TABLE news_items (
  id serial PRIMARY KEY,
  entity_id integer REFERENCES entities NOT NULL,
  user_id integer REFERENCES users,
  url varchar(100) NOT NULL,
  header text NOT NULL,
  body text,
  fake_votes integer NOT NULL default 0,
  real_votes integer NOT NULL default 0,
  created_at timestamp DEFAULT now()
);

CREATE INDEX news_items_user_id_index ON news_items (user_id);
CREATE INDEX news_items_entity_id_index ON news_items (entity_id);

