CREATE TABLE users (
  id serial PRIMARY KEY,
  username varchar (25) UNIQUE NOT NULL,
  email varchar (100) UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamp DEFAULT now()
);
