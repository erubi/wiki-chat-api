CREATE TABLE entities (
  id serial PRIMARY KEY,
  created_at timestamp DEFAULT now()
);

/* CREATE INDEX entities_user_id_index ON entities (user_id); */
