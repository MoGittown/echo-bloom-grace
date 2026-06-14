# Stripe Billing – Küchenready

Abo-Verwaltung für Küchenstudios über **Stripe Billing**. Bestehende Studios bleiben mit `subscription_status = legacy` aktiv.

## Architektur

| Komponente | Zweck |
|------------|--------|
| `studio_branding.plan` | `starter` \| `pro` \| `premium` |
| `studio_branding.subscription_status` | Stripe-Status; `legacy` = Bestandskunde |
| `stripe-checkout` | Checkout, Registrierung, Vertrieb (Premium) |
| `stripe-portal` | Stripe-Kundenportal (Rechnungen, Kündigung) |
| `stripe-webhook` | Sync Abo-Status → Datenbank |
| `/sales` | Interner Vertrieb: Premium-Zahlungslinks |

## Phasen (Status)

| Phase | Inhalt | Status |
|-------|--------|--------|
| 1 | DB + Stripe Edge Functions | ✅ |
| 2 | Self-Service `/start`, Admin-Tab „Abo“ | ✅ |
| 3 | Feature-Gating + 7-Tage-Grace bei `past_due` | ✅ |
| 4 | Premium-Vertrieb unter `/sales` | ✅ |

## Secrets

```bash
supabase secrets set --project-ref sbofbqdcygsjefgepvuz \
  STRIPE_SECRET_KEY=sk_… \
  STRIPE_WEBHOOK_SECRET=whsec_… \
  STRIPE_PRICE_STARTER=price_… \
  STRIPE_PRICE_PRO=price_… \
  STRIPE_TRIAL_DAYS=14 \
  STRIPE_GRACE_DAYS=7 \
  SALES_API_KEY=… \
  PUBLIC_WEB_URL=https://kuechenready.de
```

Premium-Preise sind **individuell** — pro Kunde eine eigene `price_…` in Stripe anlegen.

## Self-Service (Starter / Pro)

1. `/fuer-studios` → „Jetzt starten“
2. `/start?plan=starter|pro` → Registrierung → Stripe Checkout
3. Nach Zahlung: `/admin?studio={slug}&billing=success`

## Vertrieb Premium (Phase 4)

1. In Stripe: individuellen Premium-Preis anlegen → `price_…` kopieren
2. Öffnen: **`https://kuechenready.de/sales`**
3. Vertriebs-Schlüssel eingeben (`SALES_API_KEY`)
4. **Bestehendes Studio:** Slug + Price ID → Zahlungslink kopieren
5. **Neues Studio:** Firma, E-Mail, Passwort, Price ID → Studio + Link

Nach Zahlung aktiviert der Webhook `plan: premium`. Bei bestehendem aktivem Abo: **direktes Subscription-Update** (kein Doppel-Abo).

## Feature-Gating

| Feature | Starter | Pro / Premium | Legacy |
|---------|---------|---------------|--------|
| Kunden-Check | ✅ | ✅ | ✅ |
| Statistik | ❌ | ✅ | ✅ |
| Hersteller-Katalog | ❌ | ✅ | ✅ |
| KI-Berater | ❌ | ✅ | ✅ |

Serverseitig: Analytics, Protokoll-Mail, KI-Chat, Hersteller-Updates im Admin.

## Grace Period

Bei `past_due`: Check bleibt **7 Tage** erreichbar. Gesetzt bei `invoice.payment_failed` und `subscription.updated`.
