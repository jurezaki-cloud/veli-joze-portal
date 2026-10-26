alter table members add column if not exists rules_accepted_at timestamptz;
alter table members add column if not exists rules_version text;
alter table members add column if not exists email_membership boolean not null default true;
alter table members add column if not exists email_moderation boolean not null default true;
alter table members add column if not exists email_announcements boolean not null default false;
create table if not exists direct_messages (
 id uuid primary key,sender_id uuid not null references members(id) on delete cascade,
 recipient_id uuid not null references members(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 2000),
 created_at timestamptz not null default now(),read_at timestamptz,hidden_at timestamptz,
 check(sender_id<>recipient_id)
);
create index if not exists idx_dm_recipient on direct_messages(recipient_id,created_at desc);
create index if not exists idx_dm_sender on direct_messages(sender_id,created_at desc);
create table if not exists direct_message_blocks (
 blocker_id uuid not null references members(id) on delete cascade,
 blocked_id uuid not null references members(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(blocker_id,blocked_id),check(blocker_id<>blocked_id)
);
create table if not exists direct_message_reports (
 id uuid primary key,message_id uuid not null references direct_messages(id) on delete cascade,
 reporter_id uuid not null references members(id) on delete cascade,reason text not null check(char_length(reason) between 1 and 500),
 status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now(),resolved_at timestamptz,resolved_by uuid references members(id),
 unique(message_id,reporter_id)
);
create table if not exists email_outbox (
 id uuid primary key,member_id uuid not null references members(id) on delete cascade,
 category text not null check(category in ('membership','moderation','announcements')),
 dedupe_key text not null unique,subject text not null,body text not null,
 status text not null default 'pending' check(status in ('pending','sending','sent','skipped','failed')),
 attempts integer not null default 0,created_at timestamptz not null default now(),
 next_attempt_at timestamptz not null default now(),locked_at timestamptz,sent_at timestamptz,
 last_error text not null default ''
);
create index if not exists idx_email_outbox_pending on email_outbox(status,next_attempt_at);
