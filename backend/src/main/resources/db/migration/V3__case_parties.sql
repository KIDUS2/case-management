-- A case can now have several people reporting (a group) and several people it is about.
create table case_party (
  id         bigserial primary key,
  case_id    bigint      not null references church_case (id) on delete cascade,
  person_id  bigint      not null references person (id),
  party_role varchar(20) not null,
  sort_order int         not null default 0,
  unique (case_id, person_id, party_role)
);
create index ix_party_case on case_party (case_id);
create index ix_party_person on case_party (person_id);

-- existing cases: their single person becomes the reporting person
insert into case_party (case_id, person_id, party_role, sort_order)
select id, person_id, 'COMPLAINANT', 0 from church_case;

-- short code that staff type to open a case
alter table church_case add column code varchar(8);
update church_case set code = upper(substr(md5(id::text || clock_timestamp()::text), 1, 6));
alter table church_case alter column code set not null;
create unique index uq_case_code on church_case (code);

drop index if exists ix_case_person;
alter table church_case drop column person_id;
alter table church_case drop column role_in_case;
alter table church_case drop column case_no;
