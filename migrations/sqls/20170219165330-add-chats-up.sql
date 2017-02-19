CREATE TABLE chats (
  id integer REFERENCES entities NOT NULL,
  title varchar(200) UNIQUE NOT NULL,
  chat_type varchar(100) NOT NULL DEFAULT 'default'
);

CREATE UNIQUE INDEX chats_title_index ON chats (lower(title));
