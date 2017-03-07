CREATE TABLE news_sources (
  id integer REFERENCES entities ON DELETE CASCADE PRIMARY KEY,
  url varchar(100) UNIQUE NOT NULL,
  name varchar(100) UNIQUE NOT NULL
);

