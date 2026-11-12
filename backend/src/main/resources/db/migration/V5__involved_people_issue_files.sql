-- People called in later (witnesses, accountants, ...) say how they are involved.
alter table case_party add column involvement text;

-- A file can belong to one issue (sub-case), for example the paper HR attaches when it resolves.
alter table case_file add column issue_id bigint references case_issue (id) on delete set null;
create index ix_file_issue on case_file (issue_id);
