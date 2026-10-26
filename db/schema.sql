-- Veli Jože production schema (PostgreSQL)
create table if not exists members (
 id uuid primary key, email text unique not null,
 display_name text not null, nickname text not null, zone text check(zone in ('A','B','C','D')),
 parcel_private text not null, role text not null default 'member' check(role in ('member','moderator','admin')),
 approved boolean not null default false, show_zone boolean not null default true,
 notifications boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists chat_messages (
 id uuid primary key, room text not null, author_id uuid not null references members(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 500), created_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists listings (
 id uuid primary key, author_id uuid not null references members(id) on delete cascade,
 title text not null, category text not null, price text, description text not null, status text not null default 'pending',
 created_at timestamptz not null default now()
);
create table if not exists reports (
 id uuid primary key, author_id uuid references members(id) on delete set null,
 category text not null, location text not null, description text not null, status text not null default 'open',
 created_at timestamptz not null default now()
);
create table if not exists announcements (
 id uuid primary key, title text not null, type text not null, content text not null,
 author_id uuid references members(id), published_at timestamptz not null default now()
);
create table if not exists events (
 id uuid primary key, title text not null, event_date date not null, event_time time not null,
 location text not null, description text not null, author_id uuid references members(id), created_at timestamptz not null default now()
);
create table if not exists moderation_actions (
 id uuid primary key, moderator_id uuid not null references members(id),
 target_type text not null, target_id uuid not null, action text not null, created_at timestamptz not null default now()
);
create index if not exists idx_chat_room_created on chat_messages(room,created_at desc);
create index if not exists idx_listings_status on listings(status,created_at desc);
create index if not exists idx_reports_status on reports(status,created_at desc);
create table if not exists rate_limits (
 key text primary key, count integer not null, reset_at timestamptz not null
);
create index if not exists idx_rate_limits_reset on rate_limits(reset_at);
create table if not exists gallery_photos (
 id uuid primary key,
 author_id uuid not null references members(id) on delete cascade,
 title text not null check(char_length(title) between 3 and 120),
 image bytea not null check(octet_length(image) <= 5242880),
 width integer not null, height integer not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 reviewed_by uuid references members(id), reviewed_at timestamptz
);
create index if not exists idx_gallery_status_created on gallery_photos(status,created_at desc);

alter table announcements add column if not exists archived_at timestamptz;

create table if not exists announcement_reads (
 member_id uuid not null references members(id) on delete cascade,
 announcement_id uuid not null references announcements(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(member_id,announcement_id)
);

alter table events add column if not exists archived_at timestamptz;

alter table members add column if not exists first_name text not null default '';
alter table members add column if not exists last_name text not null default '';
alter table members add column if not exists profile_nickname text not null default '';
alter table members add column if not exists display_mode text not null default 'nickname' check(display_mode in ('nickname','first_name','first_last','custom'));
alter table members add column if not exists custom_name text not null default '';
alter table members add column if not exists bio text not null default '';
alter table members add column if not exists avatar bytea;
alter table members add column if not exists avatar_updated_at timestamptz;

alter table members add column if not exists legacy_zone text;
alter table members drop constraint if exists members_zone_check;
update members set legacy_zone=zone,zone=null where zone in ('A','B','C','D');
do $$ begin if not exists(select 1 from pg_constraint where conrelid='members'::regclass and conname='members_zone_colors_check') then alter table members add constraint members_zone_colors_check check(zone in ('rumena','rdeca','modra','zelena')); end if; end $$;
alter table members add column if not exists blocked_until timestamptz;
alter table members add column if not exists blocked_permanent boolean not null default false;
alter table members add column if not exists block_reason text not null default '';
alter table members add column if not exists session_version integer not null default 0;
create table if not exists member_actions (
 id uuid primary key, member_id uuid not null references members(id) on delete cascade,
 actor_id uuid references members(id) on delete set null,
 action text not null check(action in ('warning','block','unblock','edit','role','approve','reject','photo')),
 reason text not null default '', created_at timestamptz not null default now()
);
create index if not exists idx_member_actions on member_actions(member_id,created_at desc);
create table if not exists member_credentials (
 member_id uuid primary key references members(id) on delete cascade,
 password_hash text not null, email_verified_at timestamptz,
 updated_at timestamptz not null default now()
);
create table if not exists account_tokens (
 token_hash text primary key, member_id uuid not null references members(id) on delete cascade,
 purpose text not null check(purpose in ('verify','reset')),
 expires_at timestamptz not null, created_at timestamptz not null default now()
);
create index if not exists idx_account_tokens_member on account_tokens(member_id,purpose);
create unique index if not exists idx_account_token_purpose on account_tokens(member_id,purpose);

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

create table if not exists privacy_requests (
 id uuid primary key, member_id uuid not null references members(id) on delete cascade,
 kind text not null check(kind in ('access','correction','deletion','restriction','objection','portability')),
 details text not null default '' check(char_length(details)<=2000),
 status text not null default 'open' check(status in ('open','reviewing','closed')),
 created_at timestamptz not null default now(),due_at timestamptz not null default (now()+interval '1 month'),
 response text not null default '' check(char_length(response)<=4000),
 resolved_at timestamptz,handled_by uuid references members(id) on delete set null
);
create index if not exists idx_privacy_requests_due on privacy_requests(status,due_at);
create table if not exists privacy_request_actions (
 id uuid primary key,request_id uuid not null references privacy_requests(id) on delete cascade,
 actor_id uuid not null references members(id),status text not null,response text not null,
 created_at timestamptz not null default now()
);
