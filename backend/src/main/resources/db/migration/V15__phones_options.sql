-- more than one phone number; the administrator can allow a person to have none
ALTER TABLE person ADD COLUMN extra_phones TEXT;
ALTER TABLE person ADD COLUMN phone_exempt BOOLEAN NOT NULL DEFAULT FALSE;

-- dropdown lists the administrator manages in Settings
CREATE TABLE option_item (
    id        BIGSERIAL PRIMARY KEY,
    list_key  VARCHAR(20)  NOT NULL,
    code      VARCHAR(40)  NOT NULL,
    label     VARCHAR(120) NOT NULL,
    label_am  VARCHAR(120),
    icon      VARCHAR(16),
    system    BOOLEAN      NOT NULL DEFAULT FALSE,
    active    BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_no   INT          NOT NULL DEFAULT 0,
    UNIQUE (list_key, code)
);
INSERT INTO option_item (list_key, code, label, label_am, icon, system, sort_no) VALUES
  ('ISSUE_TYPE', 'HR',         'HR management', 'የሰው ሀብት አስተዳደር', '👥', TRUE, 1),
  ('ISSUE_TYPE', 'FINANCE',    'Finance',       'ፋይናንስ',           '💰', TRUE, 2),
  ('ISSUE_TYPE', 'MANAGEMENT', 'Management',    'አመራር',            '🏛️', TRUE, 3),
  ('ISSUE_TYPE', 'COURT',      'Court matter',  'የፍርድ ቤት ጉዳይ',     '⚖️', TRUE, 4),
  ('ISSUE_TYPE', 'UNCLEAR',    'Not clear yet', 'ገና ግልጽ አይደለም',   '❓', TRUE, 5);
INSERT INTO option_item (list_key, code, label, label_am, sort_no) VALUES
  ('SUB_CITY', 'Addis Ketema',     'Addis Ketema',     'አዲስ ከተማ',       1),
  ('SUB_CITY', 'Akaki Kaliti',     'Akaki Kaliti',     'አቃቂ ቃሊቲ',       2),
  ('SUB_CITY', 'Arada',            'Arada',            'አራዳ',            3),
  ('SUB_CITY', 'Bole',             'Bole',             'ቦሌ',             4),
  ('SUB_CITY', 'Gullele',          'Gullele',          'ጉለሌ',            5),
  ('SUB_CITY', 'Kirkos',           'Kirkos',           'ቂርቆስ',           6),
  ('SUB_CITY', 'Kolfe Keranio',    'Kolfe Keranio',    'ኮልፌ ቀራኒዮ',       7),
  ('SUB_CITY', 'Lideta',           'Lideta',           'ልደታ',            8),
  ('SUB_CITY', 'Lemi Kura',        'Lemi Kura',        'ለሚ ኩራ',          9),
  ('SUB_CITY', 'Nifas Silk-Lafto', 'Nifas Silk-Lafto', 'ንፋስ ስልክ ላፍቶ',     10),
  ('SUB_CITY', 'Yeka',             'Yeka',             'የካ',             11);
