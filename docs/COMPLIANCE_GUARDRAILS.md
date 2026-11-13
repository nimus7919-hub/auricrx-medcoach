# AuricRX Médicos — Compliance Guardrails (SaMD / CDS)

**Audience:** engineers and product.  
**Status:** Phase 1 product rules (approved direction 11 Nov 2026).  
**Not legal advice.** No company legal-entity details. Intended use and marketing claims matter as much as code.

AuricRX Médicos is a tool for **organizing and displaying information** the patient logged and limits the doctor typed. It does **not** replace clinical judgment and must not behave as Software as a Medical Device (SaMD) or clinical decision support that diagnoses, triages, or recommends treatment.

---

## Do

- Store, display, and transmit **raw** readings, symptoms (verbatim), dates, counts, min/max, and documents the patient shared.
- Alert **only** when a value crosses a **per-patient limit the doctor set**. In-app copy must name the doctor's rule and the observed value descriptively (e.g. Spanish: *Lectura 162/95 por encima del límite de 150 que usted configuró*).
- Keep **push / lock-screen** text generic — no patient names, no health values.
- Let AI (when enabled) **summarize descriptively only**: counts, min/max, dates, logged symptoms verbatim. Run a **server-side** banned-term filter (ES + EN) and fall back to a **non-AI template** if the model output fails the filter.
- Show any “AI insights” surface as **disabled / Próximamente** with waitlist only until a registered pathway exists.
- Enforce **per-category patient consent**, immediate **revocation**, and an **audit log** for link/consent/read/alert events.
- Show disclaimers in **Spanish (es-MX style via `es`) and English**: organizing tool; does not replace clinical judgment.
- Fail **closed** on calendar sync errors or stale sync (hide availability; show warning). Never invent free slots.
- Route emergencies to in-person / emergency care in copy; do not imply 24/7 monitoring.
- In-app doctor↔patient messaging is structured requests only (not open chat). Push stays generic. Office hours are doctor-configured (days, multiple windows, timezone, vacation pause); outside windows messages queue with an auto-notice.

## Don't

- Diagnose, risk-score, triage, or label patients/readings as deteriorating, worsening, critical, urgent, or abnormal.
- Recommend treatments, doses, or medications.
- Predict outcomes or “who needs attention first” by health status.
- Ship default clinical cutoffs as medical disease thresholds (e.g. built-in “systolic 140 = disease”).
- Put clinical values or judgments in push notifications, emails, or marketing claims.
- Auto-write appointments into Google/Outlook until two-way sync and conflict checks are proven.
- Rank the patient list by inferred risk or urgency.
- Interpret lab files or clinical photos as a diagnostic app would.

## Enforcement in this repo

| Control | Where |
|---|---|
| Banned clinical-judgment terms (ES + EN) | `packages/doctor-core/src/compliance/bannedTerms.ts` |
| Descriptive in-app alert copy | `packages/doctor-core/src/compliance/alertCopy.ts` + doctor UI |
| Generic push copy | `server/doctor-alerts.js`, i18n `doctorMode.alerts.push*` |
| AI system prompt + output filter + template fallback | `server/doctor-ai-summary.js`, `packages/doctor-core/src/compliance/aiFilter.ts` |
| AI insights = Próximamente + waitlist | Doctor app home card |
| Consent + revoke + audit | `packages/doctor-core` access rules, patient hub, Firestore rules |
| Automated scan of i18n / templates | `npm run check:compliance-terms` → `scripts/check-compliance-terms.js` |
| Disclaimers | i18n `doctorMode.compliance.disclaimer*` |

## CI / local checks

```bash
npm run check:compliance-terms
npm test -- --testPathPattern=doctor
node server/doctor-alerts.test.js
node server/doctor-ai-summary.test.js
```

If `check:compliance-terms` fails, remove or rephrase the flagged string. Do not add allowlist exceptions for clinical judgment language without an explicit product/regulatory decision.
