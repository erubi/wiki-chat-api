CREATE TABLE entities (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX entities_user_id_index ON entities (user_id);
