-- Departments are configurable by the admin; each can be linked to the kind of issue it normally handles.
create table department (
  id               bigserial primary key,
  name             varchar(120) not null,
  handles_category varchar(30),
  active           boolean      not null default true,
  created_at       timestamptz  not null default now()
);
create unique index uq_department_name on department (lower(name));

insert into department (name, handles_category) values
  ('Human Resources', 'HR'),
  ('Finance',         'FINANCE'),
  ('Management',      'MANAGEMENT'),
  ('Legal',           'COURT');

alter table app_user add column department_id bigint references department (id);
create index ix_user_department on app_user (department_id);

-- Every issue now has its own progress.
alter table case_issue add column status          varchar(20) not null default 'NEW';
alter table case_issue add column department_id   bigint references department (id);
alter table case_issue add column referred_at     timestamptz;
alter table case_issue add column return_on       date;
alter table case_issue add column resolution_note text;
alter table case_issue add column resolved_by     varchar(60);
alter table case_issue add column resolved_at     timestamptz;
alter table case_issue add column court_at        timestamptz;
alter table case_issue add column court_ack_by    varchar(60);
alter table case_issue add column court_ack_at    timestamptz;

update case_issue i set status = 'RESOLVED'
  from church_case c where c.id = i.case_id and c.status = 'RESOLVED';

create index ix_issue_dept_status on case_issue (department_id, status);
create index ix_issue_return_on   on case_issue (return_on) where return_on is not null and status <> 'RESOLVED';

-- History of everything that happens to a case.
create table case_event (
  id         bigserial primary key,
  case_id    bigint      not null references church_case (id) on delete cascade,
  issue_id   bigint,
  event_type varchar(20) not null,
  message    text        not null,
  actor      varchar(60) not null,
  created_at timestamptz not null default now()
);
create index ix_event_case on case_event (case_id, created_at desc);

insert into case_event (case_id, event_type, message, actor, created_at)
select id, 'CREATED', 'Case registered', created_by, created_at from church_case;

-- Uploaded documents (letters, scans, evidence).
create table case_file (
  id            bigserial primary key,
  case_id       bigint       not null references church_case (id) on delete cascade,
  original_name varchar(255) not null,
  stored_name   varchar(80)  not null unique,
  content_type  varchar(120),
  size_bytes    bigint       not null,
  uploaded_by   varchar(60)  not null,
  uploaded_at   timestamptz  not null default now()
);
create index ix_file_case on case_file (case_id);

-- In-app notifications. Built for hundreds of cases a day: always read by user, newest first.
create table notification (
  id         bigserial primary key,
  user_id    bigint       not null references app_user (id) on delete cascade,
  type       varchar(20)  not null,
  title      varchar(200) not null,
  body       text,
  case_id    bigint,
  case_code  varchar(8),
  created_at timestamptz  not null default now(),
  read_at    timestamptz
);
create index ix_notification_user on notification (user_id, created_at desc);
create index ix_notification_unread on notification (user_id) where read_at is null;
