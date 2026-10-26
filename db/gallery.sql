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
