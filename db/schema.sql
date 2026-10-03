-- Veli Jože production schema (PostgreSQL)
create extension if not exists pgcrypto;
create table if not exists members (
 id uuid primary key default gen_random_uuid(), email text unique not null,
 display_name text not null, nickname text not null, zone text check(zone in ('A','B','C','D')),
 parcel_private text not null, role text not null default 'member' check(role in ('member','moderator','admin')),
 approved boolean not null default false, show_zone boolean not null default true,
 notifications boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists chat_messages (
 id uuid primary key default gen_random_uuid(), room text not null, author_id uuid not null references members(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 500), created_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists listings (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references members(id) on delete cascade,
 title text not null, category text not null, price text, description text not null, status text not null default 'pending',
 created_at timestamptz not null default now()
);
create table if not exists reports (
 id uuid primary key default gen_random_uuid(), author_id uuid references members(id) on delete set null,
 category text not null, location text not null, description text not null, status text not null default 'open',
 created_at timestamptz not null default now()
);
create table if not exists announcements (
 id uuid primary key default gen_random_uuid(), title text not null, type text not null, content text not null,
 author_id uuid references members(id), published_at timestamptz not null default now()
);
create table if not exists events (
 id uuid primary key default gen_random_uuid(), title text not null, event_date date not null, event_time time not null,
 location text not null, description text not null, author_id uuid references members(id), created_at timestamptz not null default now()
);
create table if not exists moderation_actions (
 id uuid primary key default gen_random_uuid(), moderator_id uuid not null references members(id),
 target_type text not null, target_id uuid not null, action text not null, created_at timestamptz not null default now()
);
create index if not exists idx_chat_room_created on chat_messages(room,created_at desc);
create index if not exists idx_listings_status on listings(status,created_at desc);
create index if not exists idx_reports_status on reports(status,created_at desc);
