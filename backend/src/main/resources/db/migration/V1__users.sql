create table app_user (
  id            bigserial primary key,
  username      varchar(60)  not null unique,
  full_name     varchar(120) not null,
  password_hash varchar(100) not null,
  role          varchar(20)  not null,
  active        boolean      not null default true,
  created_at    timestamptz  not null default now()
);
