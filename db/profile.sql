alter table members add column if not exists first_name text not null default '';
alter table members add column if not exists last_name text not null default '';
alter table members add column if not exists profile_nickname text not null default '';
alter table members add column if not exists display_mode text not null default 'nickname' check(display_mode in ('nickname','first_name','first_last','custom'));
alter table members add column if not exists custom_name text not null default '';
alter table members add column if not exists bio text not null default '';
alter table members add column if not exists avatar bytea;
alter table members add column if not exists avatar_updated_at timestamptz;
