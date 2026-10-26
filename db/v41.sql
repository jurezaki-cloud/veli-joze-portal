-- V41 additive migration: push, new-since-last-visit, photos, content reports, event reminders
alter table direct_messages add column if not exists image bytea check(octet_length(image)<=5242880);
alter table chat_messages add column if not exists image bytea check(octet_length(image)<=5242880);
alter table member_preferences add column if not exists messages boolean not null default true;
alter table member_preferences add column if not exists push_enabled boolean not null default false;
create table if not exists push_subscriptions(member_id uuid not null references members(id) on delete cascade,endpoint text not null,subscription jsonb not null,created_at timestamptz not null default now(),primary key(member_id,endpoint));
create table if not exists member_visits(member_id uuid primary key references members(id) on delete cascade,last_seen_at timestamptz not null default now());
create table if not exists content_reports(id uuid primary key,reporter_id uuid not null references members(id) on delete cascade,target_type text not null check(target_type in ('community_post','listing','chat_message')),target_id uuid not null,reason text not null check(char_length(reason) between 3 and 500),status text not null default 'open' check(status in ('open','resolved')),created_at timestamptz not null default now(),resolved_at timestamptz,resolved_by uuid references members(id),unique(reporter_id,target_type,target_id));
create index if not exists idx_content_reports_status on content_reports(status,created_at desc);
create table if not exists event_reminders(event_id uuid not null references events(id) on delete cascade,member_id uuid not null references members(id) on delete cascade,enabled boolean not null default true,primary key(event_id,member_id));
