CREATE TABLE users (
  id serial PRIMARY KEY,
  username varchar (25) NOT NULL,
  email varchar (100) NOT NULL,
  password text NOT NULL,
  created_at timestamp
);
