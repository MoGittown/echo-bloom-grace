-- Add landing page fields to studio_branding
ALTER TABLE public.studio_branding
ADD COLUMN landing_headline TEXT DEFAULT 'Vermeiden Sie die 3 teuersten Fehler beim ersten Küchentermin',
ADD COLUMN landing_subheadline TEXT DEFAULT 'In nur 7 Minuten perfekt vorbereitet für Ihre Küchenberatung',
ADD COLUMN landing_benefit_1 TEXT DEFAULT 'Sparen Sie Zeit im Beratungsgespräch',
ADD COLUMN landing_benefit_2 TEXT DEFAULT 'Vermeiden Sie kostspielige Planungsfehler',
ADD COLUMN landing_benefit_3 TEXT DEFAULT 'Erhalten Sie ein maßgeschneidertes Angebot',
ADD COLUMN landing_cta_text TEXT DEFAULT 'Jetzt starten',
ADD COLUMN landing_why_text TEXT DEFAULT 'Studios mit vorbereiteten Kunden können sofort mit der Planung beginnen – das spart Zeit und führt zu besseren Ergebnissen.',
ADD COLUMN show_landing_page BOOLEAN DEFAULT true;