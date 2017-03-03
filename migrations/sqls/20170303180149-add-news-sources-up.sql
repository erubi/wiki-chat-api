CREATE TABLE news_sources (
  id integer UNIQUE REFERENCES entities ON DELETE CASCADE NOT NULL,
  url varchar(100) UNIQUE NOT NULL,
  name varchar(100) UNIQUE NOT NULL,
  created_at timestamp DEFAULT now()
);

