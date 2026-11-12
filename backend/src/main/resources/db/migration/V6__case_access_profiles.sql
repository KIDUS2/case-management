-- Who may open a case besides the admin: people the admin added to it (the creator and the receiving department get in automatically).
create table case_grant (
  id         bigserial primary key,
  case_id    bigint      not null references church_case (id) on delete cascade,
  user_id    bigint      not null references app_user (id) on delete cascade,
  granted_by varchar(60) not null,
  granted_at timestamptz not null default now(),
  unique (case_id, user_id)
);
create index ix_grant_user on case_grant (user_id);

-- Staff profile details, and an admin-given privilege to see every case.
alter table app_user add column phone         varchar(40);
alter table app_user add column email         varchar(120);
alter table app_user add column job_title     varchar(120);
alter table app_user add column can_view_all  boolean not null default false;
