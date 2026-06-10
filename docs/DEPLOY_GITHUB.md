# GitHub Actions → Hostinger (kuechenready.de)

## Status ansehen

1. Öffne: https://github.com/MoGittown/echo-bloom-grace/actions
2. Workflow **„Deploy Web to Hostinger“**
3. Grüner Haken = erfolgreich
4. Klick auf den Run → Tab **Summary** zeigt Build-/Deploy-Details

Bei Push auf `main` startet der Workflow automatisch.

## Secrets (einmalig)

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Hostinger FTP

| Secret | Beispiel |
|--------|----------|
| `FTP_SERVER` | `ftp.kuechenready.de` |
| `FTP_USERNAME` | FTP-Benutzer aus hPanel |
| `FTP_PASSWORD` | FTP-Passwort |
| `FTP_SERVER_DIR` | `public_html` |

### Build (Supabase + Domain)

| Secret | Wert |
|--------|------|
| `VITE_SUPABASE_URL` | `https://pstfazamjmpcywgtkoyt.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon-Key aus Supabase |
| `VITE_PUBLIC_WEB_URL` | `https://kuechenready.de` |

Optional: `VITE_PLAY_STORE_URL`

**Ohne FTP-Secrets:** Job „Build Web App“ wird grün, „Deploy to Hostinger“ schlägt fehl.

## Manuell starten

Actions → Deploy Web to Hostinger → **Run workflow** → Branch `main`.
