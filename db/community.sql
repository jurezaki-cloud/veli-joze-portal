-- V32: additive, repeatable community migration. No existing data is removed.
create table if not exists community_posts (
 id uuid primary key, author_id uuid not null references members(id) on delete cascade,
 board text not null check(board in ('lost-found','help')),
 kind text not null check(kind in ('lost','found','need','offer')),
 title text not null check(char_length(title) between 3 and 120),
 description text not null check(char_length(description) between 10 and 2500), location text not null,
 image bytea check(octet_length(image)<=5242880),
 status text not null default 'open' check(status in ('open','resolved','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((board='lost-found' and kind in ('lost','found')) or (board='help' and kind in ('need','offer')))
);
create index if not exists idx_community_board on community_posts(board,status,created_at desc);
create table if not exists community_replies (
 id uuid primary key, post_id uuid not null references community_posts(id) on delete cascade,
 author_id uuid not null references members(id) on delete cascade,
 body text not null check(char_length(body) between 2 and 1000), created_at timestamptz not null default now()
);
create index if not exists idx_community_replies on community_replies(post_id,created_at);
create table if not exists event_rsvps (
 event_id uuid not null references events(id) on delete cascade,
 member_id uuid not null references members(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(event_id,member_id)
);
create table if not exists report_updates (
 id uuid primary key, report_id uuid not null references reports(id) on delete cascade,
 author_id uuid references members(id) on delete set null,
 status text not null check(status in ('open','reviewing','closed')), body text not null,
 image bytea check(octet_length(image)<=5242880), created_at timestamptz not null default now()
);
create index if not exists idx_report_updates on report_updates(report_id,created_at);
create table if not exists member_preferences (
 member_id uuid primary key references members(id) on delete cascade,
 events boolean not null default true, announcements boolean not null default true,
 replies boolean not null default true, event_reminders boolean not null default true
);
create table if not exists portal_notifications (
 id uuid primary key, member_id uuid not null references members(id) on delete cascade,
 category text not null check(category in ('replies')), title text not null,
 href text not null, created_at timestamptz not null default now()
);
create index if not exists idx_portal_notifications on portal_notifications(member_id,created_at desc);
create table if not exists notification_reads (
 member_id uuid not null references members(id) on delete cascade,
 notification_key text not null check(char_length(notification_key)<=160),
 read_at timestamptz not null default now(), primary key(member_id,notification_key)
);
