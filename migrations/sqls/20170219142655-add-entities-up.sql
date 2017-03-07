CREATE TABLE entities (
  id serial PRIMARY KEY,
  up_votes integer NOT NULL default 0,
  down_votes integer NOT NULL default 0,
  created_at timestamp DEFAULT now()
);
