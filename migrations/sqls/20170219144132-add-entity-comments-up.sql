CREATE TABLE entity_comments (
  id integer REFERENCES entities ON DELETE CASCADE PRIMARY KEY,
  entity_id integer REFERENCES entities NOT NULL,
  user_id integer REFERENCES users NOT NULL,
  body text NOT NULL
);

CREATE INDEX entity_comments_user_id_index ON entity_comments (user_id);
CREATE INDEX entity_comments_entity_id_index ON entity_comments (entity_id);
