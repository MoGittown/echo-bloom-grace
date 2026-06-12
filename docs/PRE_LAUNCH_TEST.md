# Pre-Launch Testplan — Küchenready (Pilot Vollmer)

Vor dem ersten Küchenstudio alle Punkte durchgehen. Geschätzte Dauer: **45–60 Minuten**.

---

## Vorbereitung (einmalig)

- [ ] 🔐 **Admin-Passwort geändert** (Bootstrap-Hash ersetzen) — via `scripts/reset-admin-password.sh` mit gesetztem `ADMIN_RESET_KEY`-Secret. **Blocker!**
- [ ] 🔐 **Secret `ADMIN_RESET_KEY`** in Supabase gesetzt (kein hartcodierter Fallback mehr)
- [ ] **Hostinger Git Auto-Deploy** deaktiviert (nur GitHub Actions)
- [x] **Lovable/Supabase:** `RESEND_API_KEY` gesetzt
- [x] **Lovable/Supabase:** `LOVABLE_API_KEY` gesetzt (KI-Berater)
- [ ] **Resend-Domain verifiziert** + Secret `RESEND_FROM_EMAIL` gesetzt (siehe unten)

---

## 1. Admin (10 Min)

URL: https://kuechenready.de/admin

- [ ] Login funktioniert
- [ ] **DSGVO-Check** zeigt 5/5 grün (Tab Recht)
- [ ] **Studio-Slug** = `vollmer-objektmoebel` (Tab Grunddaten)
- [ ] **E-Mail** = `office@vollmer-objektmoebel.com`
- [ ] Tab **Link & QR** zeigt Landing- und Check-URL
- [ ] Logo/Farben/Hersteller gespeichert und sichtbar

---

## 2. Kunden-Landing (5 Min)

URL: https://kuechenready.de/s/vollmer-objektmoebel

- [ ] Studio-Name, Logo, Slogan korrekt
- [ ] Button „Jetzt Küchen-Check starten“ öffnet Check
- [ ] Footer: Impressum + Datenschutz erreichbar
- [ ] Mobile Ansicht OK (Smartphone-Browser)

---

## 3. Küchen-Check Web (20 Min)

URL: https://kuechenready.de/s/vollmer-objektmoebel/check

| Schritt | Test |
|---------|------|
| Stil & Budget | Auswahl speichern, weiter |
| Geräte / Spüle / Raum | Mindestens 1 Feld je Schritt |
| Grundriss | Element platzieren |
| Fotos | 1 Testfoto hochladen |
| Kontakt | Name, E-Mail, Telefon |
| Übersicht | Alle Daten sichtbar |

- [ ] **Einwilligung**-Checkbox mit Studio-Text + Links
- [ ] **PDF speichern** funktioniert
- [ ] **Drucken** Vorschau OK
- [ ] **Protokoll ans Studio senden** → E-Mail bei `office@vollmer-objektmoebel.com` (Resend!)
- [ ] **KI-Berater** (Chat unten rechts) antwortet, falls aktiviert

**Admin-Toggle testen:** Tab „Check & Funktionen“ → z. B. „Protokoll per E-Mail“ aus → speichern → Check neu laden → Versand-Button weg.

---

## 4. Rechtliches (5 Min)

- [ ] https://kuechenready.de/s/vollmer-objektmoebel/impressum
- [ ] https://kuechenready.de/s/vollmer-objektmoebel/datenschutz
- [ ] Links in Einwilligung-Checkbox funktionieren

---

## 5. Flutter-App (10 Min, optional)

- [ ] `app/.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PUBLIC_WEB_URL=https://kuechenready.de`
- [ ] Landing zeigt Studio-Branding
- [ ] Footer: Impressum / Datenschutz
- [ ] Kompletter Check wie Web
- [ ] **5× Logo** → Admin-WebView lädt kuechenready.de/admin
- [ ] Protokoll-Versand + PDF

---

## 6. Smoke-URLs (automatisch)

Alle müssen **HTTP 200** liefern:

```
https://kuechenready.de/
https://kuechenready.de/admin
https://kuechenready.de/s/vollmer-objektmoebel
https://kuechenready.de/s/vollmer-objektmoebel/check
https://kuechenready.de/s/vollmer-objektmoebel/impressum
https://kuechenready.de/s/vollmer-objektmoebel/datenschutz
```

---

## Resend: Domain verifizieren (Blocker für Protokoll-E-Mail)

Aktuell: Absender `onboarding@resend.dev` — Mails kommen **nur** an die im Resend-Account verifizierte Adresse, **nicht** an `office@vollmer-objektmoebel.com`.

1. [resend.com/domains](https://resend.com/domains) → Domain hinzufügen (`kuechenready.de` oder Subdomain `mail.kuechenready.de`)
2. DNS-Einträge (SPF, DKIM, optional DMARC) bei **Hostinger** → DNS-Zone für die Domain
3. In Resend **Verify** — alle Einträge grün
4. In Lovable/Supabase Secret setzen:
   ```
   RESEND_FROM_EMAIL=Küchenberatung <protokoll@kuechenready.de>
   ```
   (Adresse muss zur verifizierten Domain passen)
5. Edge Function `send-protocol-email` neu deployen (Lovable oder GitHub Actions)

**Test:** Check durchlaufen → „Protokoll ans Studio senden“ → E-Mail muss bei `office@vollmer-objektmoebel.com` ankommen (auch Spam prüfen).

---

## Bekannte Limits (Pilot OK)

| Thema | Status |
|-------|--------|
| Multi-Studio (mehrere Zeilen) | Später |
| iOS Deep Link `kuechencheck://` | Android OK, iOS fehlt |
| App Store Release | Später — Browser reicht für Pilot |
| `pdf.autoEmailToStudio` | Noch nicht implementiert |
| Google Analytics im Admin | Noch nicht eingebunden |

---

## Go / No-Go

**Go** wenn: Admin 5/5, Check komplett durchlaufbar, Protokoll-E-Mail ankommt, Impressum/Datenschutz erreichbar.

**No-Go** wenn: weiße Seite nach Deploy, E-Mail kommt nicht an, DSGVO rot, falscher Studio-Name im Check.
