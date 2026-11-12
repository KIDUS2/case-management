create table church (
  id         bigserial primary key,
  name       varchar(160) not null,
  created_at timestamptz  not null default now()
);
create unique index uq_church_name on church (lower(name));

create table person (
  id             bigserial primary key,
  full_name      varchar(160) not null,
  phone          varchar(40),
  church_id      bigint       not null references church (id),
  working_status varchar(30)  not null,
  created_at     timestamptz  not null default now()
);
create index ix_person_name on person (lower(full_name));
create index ix_person_church on person (church_id);

create table church_case (
  id               bigserial primary key,
  case_no          varchar(20) unique,
  person_id        bigint      not null references person (id),
  role_in_case     varchar(20) not null,
  status           varchar(20) not null default 'OPEN',
  discussion_notes text,
  letter_issued    boolean     not null default false,
  created_by       varchar(60) not null,
  created_at       timestamptz not null default now()
);
create index ix_case_person on church_case (person_id);
create index ix_case_status on church_case (status);

create table case_issue (
  id          bigserial primary key,
  case_id     bigint      not null references church_case (id) on delete cascade,
  category    varchar(30) not null,
  description text,
  sort_order  int         not null default 0
);
create index ix_issue_case on case_issue (case_id);
