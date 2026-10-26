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
