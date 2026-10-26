-- V34: repeatable chat repair. Existing messages remain intact.
create table if not exists chat_messages (
 id uuid primary key, room text not null,
 author_id uuid not null references members(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 500),
 created_at timestamptz not null default now(), deleted_at timestamptz
);
-- CREATE TABLE IF NOT EXISTS does not add columns to older tables.
alter table chat_messages add column if not exists deleted_at timestamptz;
create index if not exists idx_chat_room_visible on chat_messages(room,created_at desc,id desc) where deleted_at is null;
