-- V42 additive migration: forum reactions/follows, richer listings, moderation queue
alter table listings add column if not exists sale_status text not null default 'active' check(sale_status in ('active','reserved','sold'));
alter table listings add column if not exists image bytea check(octet_length(image)<=5242880);
create table if not exists listing_favorites(member_id uuid not null references members(id) on delete cascade,listing_id uuid not null references listings(id) on delete cascade,created_at timestamptz not null default now(),primary key(member_id,listing_id));
create table if not exists community_likes(member_id uuid not null references members(id) on delete cascade,post_id uuid not null references community_posts(id) on delete cascade,created_at timestamptz not null default now(),primary key(member_id,post_id));
create table if not exists community_follows(member_id uuid not null references members(id) on delete cascade,post_id uuid not null references community_posts(id) on delete cascade,created_at timestamptz not null default now(),primary key(member_id,post_id));
