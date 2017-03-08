CREATE TABLE entity_votes (
  entity_id integer REFERENCES entities ON DELETE CASCADE,
  user_id integer REFERENCES users ON DELETE CASCADE,
  vote integer DEFAULT 0 NOT NULL,
  created_at timestamp DEFAULT now()
);
