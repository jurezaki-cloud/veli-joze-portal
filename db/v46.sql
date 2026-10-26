-- V46 / Veli Jože 1.0.4 additive migration
-- Multiple listing photos; existing listings.image remains supported as the legacy cover photo.
create table if not exists listing_photos(
 id uuid primary key,
 listing_id uuid not null references listings(id) on delete cascade,
 image bytea not null check(octet_length(image)<=5242880),
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create index if not exists listing_photos_listing_idx on listing_photos(listing_id,sort_order,created_at);
