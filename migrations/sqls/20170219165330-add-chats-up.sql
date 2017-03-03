CREATE TABLE chats (
  id integer UNIQUE REFERENCES entities ON DELETE CASCADE NOT NULL,
  title varchar(200) UNIQUE NOT NULL,
  chat_type varchar(100) NOT NULL DEFAULT 'default',
  created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX chats_title_index ON chats (lower(title));
