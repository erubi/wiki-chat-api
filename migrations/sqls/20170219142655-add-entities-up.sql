CREATE TABLE entities (
  id serial PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);
