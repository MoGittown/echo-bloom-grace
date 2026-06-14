-- Korrigiert Tippfehler „spielt“ und formuliert den Warum-Text klarer (Kundensicht).
UPDATE public.studio_branding
SET landing_why_text =
  'Mit ausgefüllter Checkliste startet Ihr Beratungstermin direkt mit der Planung – das spart Ihnen Zeit und Nerven und führt zu besseren Ergebnissen.'
WHERE studio_slug = 'vollmer-objektmoebel'
  AND (
    landing_why_text IS NULL
    OR landing_why_text ILIKE '%spielt Ihnen Zeit%'
    OR landing_why_text ILIKE '%Studios mit vorbereiteten Kunden%'
  );
