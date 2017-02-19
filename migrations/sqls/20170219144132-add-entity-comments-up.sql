CREATE TABLE entity_comments (
  id serial PRIMARY KEY,
  body text NOT NULL,
  entity_id integer REFERENCES entities NOT NULL,
  user_id integer REFERENCES users NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX entity_comments_user_id_index ON entity_comments (user_id);
CREATE INDEX entity_comments_entity_id_index ON entity_comments (entity_id);
