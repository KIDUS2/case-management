-- A title before a name (Ato, Kesis, Deacon ...). The list is managed in Settings, so a person stores only its code.
ALTER TABLE person ADD COLUMN title VARCHAR(40);
INSERT INTO option_item (list_key, code, label, label_am, system, sort_no) VALUES
  ('TITLE', 'ATO',           'Ato',           'አቶ',          FALSE, 1),
  ('TITLE', 'WOIZERO',       'Woizero',       'ወይዘሮ',        FALSE, 2),
  ('TITLE', 'WOIZERIT',      'Woizerit',      'ወይዘሪት',       FALSE, 3),
  ('TITLE', 'DEACON',        'Deacon',        'ዲያቆን',        FALSE, 4),
  ('TITLE', 'KESIS',         'Kesis',         'ቀሲስ',         FALSE, 5),
  ('TITLE', 'MEMHIR',        'Memhir',        'መምህር',        FALSE, 6),
  ('TITLE', 'MELAKE_BIRHAN', 'Melake Birhan', 'መላእከ ብርሃን',   FALSE, 7),
  ('TITLE', 'MELAKE_SELAM',  'Melake Selam',  'መላእከ ሰላም',    FALSE, 8),
  ('TITLE', 'KOMOS',         'Komos',         'ቆሞስ',         FALSE, 9),
  ('TITLE', 'ABBA',          'Abba',          'አባ',          FALSE, 10),
  ('TITLE', 'LIQE_KAHNAT',   'Liqe Kahnat',   'ሊቀ ካህናት',     FALSE, 11),
  ('TITLE', 'DR',            'Dr.',           'ዶ/ር',         FALSE, 12);
