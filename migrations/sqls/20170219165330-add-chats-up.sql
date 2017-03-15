CREATE TABLE chats (
  id integer REFERENCES entities ON DELETE CASCADE PRIMARY KEY,
  title varchar(200) UNIQUE NOT NULL,
  chat_type varchar(100) NOT NULL DEFAULT 'default',
  created_at timestamp DEFAULT now(),
  CHECK (title != ''),
  CHECK (chat_type != '')
);

CREATE UNIQUE INDEX chats_title_index ON chats (lower(title));
CREATE INDEX chats_chat_type_index ON chats (chat_type);
