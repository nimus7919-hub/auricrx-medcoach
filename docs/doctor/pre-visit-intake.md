# Pre-visit AI intake (descriptive only)

**App:** AuricRX Médicos, with a patient-side flow in AuricRX MedCoach.
**Status:** Design draft. Freddy approved adding this to the roadmap and drafting the design on 13 Nov 2026 (America/Mexico_City).
**Source:** Doctor feedback voice memo, 13 Nov 2026. English transcript of the 13 Nov 2026 doctor feedback voice memo (held with the product notes; not committed here).
**This change:** docs only. No app or server code. Teammate Nova owns the patient app — this document describes that flow so the two apps stay aligned; it does not change patient-app code.

The doctor asked for a natural-language chat *before* the visit: the patient talks the way they actually talk, the AI asks follow-ups (where it hurts, how long, severity from 1 to 10), and the doctor receives a short, clean history with the extra chatter stripped out. The AI never gives treatment. The prescription, the doctor said, stays theirs. That is the right product direction. The compliance bar is stricter than the off-the-cuff example in the recording (see §3).

## 1. Goal

Take work off the doctor's plate without burying them in raw chat logs. By the time the visit starts, the doctor has a one-screen history the patient has confirmed, written in the patient's own words and organized under the usual history headings — not interpreted. Launch markets are the United States and Mexico, so all patient- and doctor-facing copy ships in English and Spanish (`en` / `es`).

## 2. How this differs from what already exists

| Surface | When | What it does | Status |
|---|---|---|---|
| **Descriptive pre-visit one-pager** | Before the visit | Templates already-logged bitácora data (counts, dates, min/max, verbatim symptoms, dose logs, documents). No conversation. | Built in Phase 1 (`packages/doctor-core/src/phase1/preVisitSummary.ts`) |
| **Descriptive AI summary** | On demand | Summarizes facts already in the system. Server-side banned-term filter; falls back to a non-AI template. | Built (`server/doctor-ai-summary.js`) |
| **Pre-visit AI intake** (this feature) | **Before** the visit | Conversational interview in ordinary language. Produces a short confirmed history of the patient's own words. | Design (this document) |
| **AI scribe** | **During** the visit | Records the visit with consent from both sides, transcribes it, and drafts a descriptive-only note the doctor reviews and signs. Audio is deleted after approval. | Planned for after launch (Freddy, 11 Nov 2026) |

The one-pager and the intake belong on the same doctor screen as two short sections: what the patient already logged, and why they are coming in today. The scribe is a different moment and must not be merged into this interview.

## 3. Hard compliance guardrails (COFEPRIS / FDA)

The intake is **descriptive only**: it organizes the patient's own words into sections. The doctor reviews everything and draws every conclusion. Non-negotiable. It must not diagnose, name a likely condition, or offer a differential (including casual labels such as "dyspepsia"); screen for red flags or warning signs (*datos de alarma*), or say that none are present; triage, rank urgency, or produce a risk score; interpret answers ("this sounds like…", "that is consistent with…", "this is getting worse"); give treatment, medication, dose, or "you should take / you should go to…" advice; or trigger a dynamic emergency warning based on what the patient typed.

A **static** emergency disclaimer is shown to **every** patient at the start, in their language:

- EN: "If this is an emergency, call 911 or your local emergency number. This intake is not emergency care and is not monitored in real time."
- ES: "Si esto es una emergencia, llama al 911 o al número de emergencias local. Esta entrevista no es atención de urgencias y no se vigila en tiempo real."

The example the doctor used in the recording — "dyspepsia, pain in the pit of the stomach, no warning signs" — is exactly the kind of output we cannot ship. The middle clause is fine (the patient's location, cleaned up). The first and last clauses are a diagnosis and a red-flag screen.

These rules follow `docs/COMPLIANCE_GUARDRAILS.md`. This is product design, not legal advice. Freddy handles the legal side; this draft does not involve the Legal teammate and does not change store listings, privacy-policy forms, or legal-entity text in the apps.

## 4. User flows

**Patient (AuricRX MedCoach — Nova's surface).** The patient starts an intake from a prompt tied to an upcoming visit, a request from their linked doctor, or an entry point such as "Tell your doctor what is going on." Only a patient with an **active link** to an entitled, verified doctor can start one. Before any question is asked, they see the purpose, who will receive it, a short privacy note (LFPDPPP-minded in Mexico; HIPAA-minded in the US — §9), and the static emergency disclaimer. They must agree to continue. They can quit at any time; nothing is sent until they confirm the summary.

They then chat in ordinary language, in English or Spanish (app locale). The AI asks a small number of follow-ups, one at a time, in the same language. It should feel like a conversation, not a numbered form — that was the point of the doctor's WhatsApp-AI analogy — but the question types are tightly constrained (§5). When the interview has enough descriptive detail, or the question budget is reached, the app shows the same short sectioned summary the doctor will see. The patient can edit any field (it is their words) and must explicitly confirm "Send to my doctor" / "Enviar a mi médico." After send, they can view what was sent and withdraw that intake, which hides it from the doctor and is written to the audit log.

**Doctor (AuricRX Médicos).** A confirmed intake appears on the existing **needs action today** list as one item: patient name, "Pre-visit intake confirmed", and time. It is not a risk-ranked queue and does not use urgency language. Opening it shows the one-screen confirmed summary, with the existing pre-visit one-pager of already-logged readings collapsed on the same screen. The raw chat is *not* on the first screen — the app should take work off doctors' plates, not bury them in data. A "View conversation" link is available if the doctor wants the source. The doctor reads it and draws their own conclusions. Nothing in the intake writes a diagnosis, a plan, or a prescription. Push / lock-screen text stays generic ("You have a new pre-visit intake"), consistent with existing message and alert push rules: no names, health values, or symptoms on the lock screen.

## 5. Conversation design

The assistant may only ask the patient to describe, in their own words: the main concern ("What would you like the doctor to know about today?"); location (where; upper / middle / lower only when the body area has a location); duration; severity as a **patient-reported** 1–10 number, recorded as "the patient said N out of 10," never as a risk score; the character of the sensation, if they want to describe it; what they say makes it better or worse; other sensations they say they have noticed; medicines, supplements, or allergies they mention; and questions they want to ask the doctor.

MVP question budget: a short opening prompt plus at most **eight** follow-ups, then generate the summary. If the patient says they are done, stop early.

Forbidden: naming or guessing a condition; asking "any warning signs / red flags / datos de alarma?" as a screening checklist, or concluding that none are present; urgency language; any advice (medicines, doses, home remedies, when to go to the ER); asking the patient to accept a medical interpretation of their answers. The static disclaimer already covers emergencies.

### Example outputs (same stomach-pain story as the recording)

**Good** — patient's words, organized:

> **Main concern:** "My stomach hurts."
> **Location:** Patient said the pain is in the upper part of the stomach, "in the pit of the stomach."
> **Duration:** Patient said it has been going on for three days.
> **Severity:** Patient rated it 6 out of 10.
> **Also mentioned:** It started the day they ate with family. They said they have not taken anything for it.
> **Questions for the doctor:** (none offered)
>
> Confirmed by the patient on 13 Nov 2026. This is the patient's own description, organized for the visit. It is not a medical opinion. The doctor reviews it and draws the conclusions.

**Bad** — must be rejected by the output filter:

> Dyspepsia. Pain in the pit of the stomach. No warning signs.

**Also bad:** "This is likely gastritis and is not urgent. No red flags. Take an antacid and come in if it worsens."

## 6. Confirmed summary format

One screen, `en` or `es` matching the interview. Fixed fields only: **Main concern** (patient's wording, lightly cleaned of filler); **Location** and **Duration** (as stated, or "Not mentioned"); **Severity** ("Patient said N / 10," or "Not mentioned"); **Also mentioned** (short bullets of other patient statements, no interpretation); **Questions for the doctor**; locale and confirmed-at metadata; and a fixed footer: patient's own description, not a medical opinion, doctor reviews. If a field was not discussed, it stays "Not mentioned." The model must not fill gaps.

## 7. Data model

Fits the existing doctor stack: Firebase Auth, named Firestore database `auricrxmedcoach`, Render API, Neon.

**Firestore `preVisitIntakes/{intakeId}`** is the record both apps sync: `id`, `doctorId`, `patientId`, optional `appointmentRequestId`; `status` (`in_progress` | `awaiting_confirmation` | `confirmed` | `viewed` | `withdrawn` | `expired`); `locale` (`en` | `es`); `consent` (`acceptedAt`, `noticeVersion`, `emergencyDisclaimerVersion`); `summary` (the confirmed structured object, or `null` until confirmed); `patientConfirmedAt`, `doctorViewedAt`, `createdAt`, `updatedAt`, `expiresAt`. Clients may create an in-progress row and update consent / confirmation for their own intake. **Only the Render service (Admin SDK)** writes `summary` and status transitions that depend on model output.

**Neon `pre_visit_turns`** is the append-only raw conversation, written only by Render: `id`, `intake_id`, `role` (`patient` | `assistant` | `system`), `text`, `created_at`. Timed deletion per §9. The confirmed Firestore summary can last as long as the doctor–patient link; the raw turns do not need to.

**`doctorAuditLogs`** is extended with `intake_started`, `intake_turn`, `intake_confirmed`, `intake_viewed`, `intake_withdrawn`, `intake_expired`, `intake_conversation_viewed`. Firestore rules will need these values when code is written; that is not part of this docs PR.

Access matches messaging and the bitácora: an entitled, verified doctor with an active link and the relevant consent category may read a *confirmed* intake for that patient. The patient reads and withdraws their own. No intake is created for an unlinked or unverified doctor.

## 8. LLM approach and validation

All model calls run on Render, never on-device. Reuse the existing descriptive-summary path (`server/doctor-ai-summary.js`, `packages/doctor-core/src/compliance/aiFilter.ts`, `bannedTerms.ts`) and extend it; do not add a second unfiltered client.

Suggested endpoints: `POST /api/patient/intake/turn` (authenticated patient, linked doctor required; returns the next allowed question or `{ done: true }`); `POST /api/patient/intake/summarize` (builds the structured summary for the patient to edit and confirm; the doctor cannot see it until confirmation); `POST /api/doctor/intake/view` (marks viewed; writes an audit log).

**System prompt (intent):** You are a descriptive pre-visit interviewer for AuricRX. Ask only the allowed question types. Use the patient's language (English or Spanish). Do not interpret, label conditions, screen for warning signs, triage, or give advice. When writing the summary, use only the patient's words organized into the fixed fields. If you are unsure, leave the field as "Not mentioned."

Output is JSON with a fixed schema (next question *or* summary fields). No free-form clinical prose. Low temperature (0–0.2). Hard cap on tokens and follow-up count.

**Validation pipeline** (fail closed):

1. Schema check — unknown keys dropped; missing fields become "Not mentioned."
2. Banned-term filter in EN and ES, extended for this feature with *red flag*, *warning signs*, *datos de alarma*, *likely*, *consistent with*, *could be*, *differential*, plus the existing diagnosis / triage / risk / treatment terms.
3. A second pass that rejects condition-naming and advice even when the label is not in the banned list (the "dyspepsia" case). If this pass is a model call, it only returns `allow` or `reject`; it must not rewrite into a more clinical summary.
4. Questions shown to the patient are filtered the same way as the summary.
5. On any failure: fall back to a **non-AI template** that quotes the patient's utterances under the fixed headings, with no added wording — the same pattern as today's AI summary fallback.

**Guardrail tests** to add next to `server/doctor-ai-summary.test.js`, while keeping `npm run check:compliance-terms`: the stomach-pain story produces the good example (no condition name, no "warning signs"); reject "dyspepsia… no warning signs," "likely gastritis, not urgent, take an antacid," and the Spanish equivalent "parece gastritis, sin datos de alarma, tome un antiácido"; reject questions that ask the patient to self-screen for red flags; the fallback template contains only quoted patient text and fixed headings; the static emergency disclaimer is present for every started intake, in `en` and `es`, and is not inserted by the model; generic push copy has no name, symptom, or severity; unlinked, unconfirmed, or withdrawn intakes are not readable by the doctor; patient confirmation is required before the doctor can see the summary.

## 9. Consent, privacy, retention, audit

Consent is collected before the first question. Purpose is narrow: prepare a descriptive history for the linked doctor for this visit. The patient can refuse, quit, or withdraw later.

Privacy notices point at the existing patient notices (`docs/privacy-notice-en.md`, `docs/privacy-notice-es.md`, and the US consumer-health notice). Mexico: LFPDPPP-minded informed consent, purpose limitation, and access / correction / cancellation / objection through the existing account and privacy flows. US: HIPAA-minded operational care — minimum necessary, access limited to the linked doctor, audit trail, no symptoms on push. These are product requirements, not a legal determination. Freddy handles legal review; do not involve the Legal teammate, and do not change store or policy forms in this design.

**Retention.** Raw turns in Neon: delete after a short fixed window once the summary is confirmed (suggested MVP: 30 days, or sooner if the patient withdraws). Confirmed summary in Firestore: keep while the doctor–patient link is active, then delete or anonymize with the link. Exact periods are an open question (§11).

**Audit.** Every start, confirm, doctor view, conversation view, withdrawal, and expiry is an append-only `doctorAuditLogs` row. No silent edits to a confirmed summary; a patient change after confirm creates a new version and a new log line.

## 10. Phases

**MVP:** Patient chat in `en` and `es`, allowed questions only, eight-follow-up cap; static disclaimer, consent, and patient confirm/edit; doctor needs-action item with the one-screen summary and the one-pager beside it, raw chat behind a link; Render validation, template fallback, audit log, and generic push; linked, entitled doctors only.

**Later:** Doctor-initiated "please complete this before Thursday"; tighter hook-up to the existing one-tap appointment request; voice input still confirmed as text; retention automation and a patient download of what was sent. After launch, the in-visit AI scribe is a separate design — do not merge intake and scribe into one model or one screen.

Out of scope: diagnosis, triage, red-flag tools, medication advice, WhatsApp as a channel, and any patient-app code in the first implementation PR (that work is scheduled with Nova).

## 11. Open questions for Freddy

1. **Who starts it?** Can the patient begin an intake anytime, only after an appointment is requested, only when the doctor asks, or some mix?
2. **Is it optional, or expected before a visit?**
3. **How long should we keep the raw chat** after the patient confirms the summary? (Suggestion: 30 days, unless the patient withdraws sooner.)
4. **May the patient edit every field** before sending, or only add a comment on top of the generated summary?
5. **Should the doctor see the raw chat at all in MVP**, or only the confirmed summary until someone asks for the source?
6. **Voice input in the first version**, or text only until the text path is solid?
7. **When should Nova start the patient-app screens** relative to the doctor inbox and the Render endpoints?

No implementation work should start until these are answered, except further docs if needed.
