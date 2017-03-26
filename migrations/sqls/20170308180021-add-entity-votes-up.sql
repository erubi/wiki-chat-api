CREATE TABLE entity_votes (
  entity_id integer REFERENCES entities ON DELETE CASCADE,
  user_id integer REFERENCES users ON DELETE CASCADE,
  PRIMARY KEY (entity_id, user_id),
  vote integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX entity_votes_user_id ON entity_votes (user_id);
CREATE INDEX entity_votes_entity_id ON entity_votes (entity_id);
