alter table push_subscriptions add column if not exists last_checked_at timestamptz;
create table if not exists push_deliveries(
 member_id uuid not null,endpoint text not null,notification_key text not null,
 attempts integer not null default 0,last_attempt_at timestamptz,sent_at timestamptz,
 primary key(member_id,endpoint,notification_key),
 foreign key(member_id,endpoint) references push_subscriptions(member_id,endpoint) on delete cascade);
