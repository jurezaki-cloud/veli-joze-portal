create table if not exists community_polls(
 id uuid primary key,author_id uuid references members(id) on delete set null,
 question text not null check(length(question) between 4 and 160),
 options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 6),
 created_at timestamptz not null default now(),closed_at timestamptz
);
create table if not exists community_poll_votes(
 poll_id uuid not null references community_polls(id) on delete cascade,
 member_id uuid not null references members(id) on delete cascade,
 option_id uuid not null,created_at timestamptz not null default now(),
 primary key(poll_id,member_id)
);
