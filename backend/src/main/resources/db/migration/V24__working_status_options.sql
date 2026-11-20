-- "This person is" becomes a list the administrator manages in Settings. Codes match the old enum names, so stored people keep working.
INSERT INTO option_item (list_key, code, label, label_am, system, sort_no) VALUES
  ('WORKING_STATUS', 'ACTIVE_EMPLOYEE',  'Active employee',           'ንቁ ሠራተኛ',            TRUE, 1),
  ('WORKING_STATUS', 'LEADER_PRIEST',    'Leader / priest',           'መሪ / ካህን',            TRUE, 2),
  ('WORKING_STATUS', 'RETIRED',          'Retired',                   'ጡረታ የወጣ',            FALSE, 3),
  ('WORKING_STATUS', 'SUSPENDED',        'Suspended',                 'የታገደ',               FALSE, 4),
  ('WORKING_STATUS', 'CONTRACT',         'Contract',                  'የኮንትራት',             FALSE, 5),
  ('WORKING_STATUS', 'VOLUNTEER',        'Volunteer',                 'በጎ ፈቃደኛ',            FALSE, 6),
  ('WORKING_STATUS', 'CHURCH_MEMBER',    'Church member (not an employee)', 'የቤተ ክርስቲያን አባል (ሠራተኛ ያልሆነ)', TRUE, 7);
