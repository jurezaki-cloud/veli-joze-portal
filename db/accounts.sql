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
