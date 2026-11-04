# US breach response plan

Version: US-2026-11-03. Owner: Adriana Hernandez. Draft operational playbook requiring owner/US-attorney approval and an incident tabletop before beta distribution. Applies to acquisition and unauthorized disclosure of identifiable consumer health data, including accidental advertising/analytics/processor disclosure; hacking is not required. Do not assume HIPAA applies or excludes the FTC Health Breach Notification Rule (HBNR).

## Roles and intake

Adriana is incident commander and notice decision owner; designate an alternate, technical responder, US privacy attorney, and processor contacts before inviting testers. The existing project contact is Auricrx.ltd@gmail.com; owner must verify mailbox ownership and monitoring. Do not email health records, credentials or identification documents. Keep the incident record in a restricted incident system, outside app analytics and ordinary logs.

## Discovery, containment and investigation

1. Record discovery date/time, reporter, incident owner, systems/processors, and the facts supporting discovery. Open the notification clock immediately; do not postpone discovery until the investigation finishes.
2. Contain access/disclosure: disable affected endpoints, jobs, integrations or exports; revoke exposed credentials; preserve evidence and relevant configuration securely. Coordinate credential changes with service owners. Do not destroy evidence or overwrite audit trails.
3. Contact Firebase/Google, Render, Neon, OpenAI and any other involved processor using verified support/security channels. Request containment, affected data, dates, recipients, downstream disclosures, deletion/return confirmation and relevant access evidence. Record names of actual third-party recipients, not just vendor categories.
4. Determine identifiable health-data categories, individuals/locations affected, acquisition/disclosure dates, whether data was accessed or reasonably believed acquired, and whether encryption and key protection change the legal analysis. Count unique affected individuals. Treat unauthorized third-party disclosures as potential breaches even without unauthorized login.
5. Counsel documents HBNR applicability and notification decisions plus applicable state laws (WA/NV/CT, California CMIA if applicable) and any shorter deadlines. Uncertainty does not reset or suspend the clock. Record reasons if notification is not required.

## Notices and deadlines

- Affected individuals: notify without unreasonable delay and no later than 60 calendar days after discovery. Use verified last-known contact channels; counsel handles substitute notices if contact information is insufficient. Provide accessible English notices and other appropriate languages.
- FTC: if 500 or more individuals are affected, notify contemporaneously with individual notices using the FTC health-breach form, without unreasonable delay and within the applicable 60-day limit. For fewer than 500, maintain the incident log and report to the FTC within 60 days after the end of the calendar year of discovery. Track both deadlines explicitly.
- Media: counsel checks the HBNR requirement for prominent media serving a state/jurisdiction when 500 or more residents are affected and schedules any required notice without unreasonable delay and within 60 days. Also check state attorney-general/regulator requirements and lawful law-enforcement delay provisions.
- No public notice is posted by an automated app process. The incident commander and counsel approve the concrete notice, recipients and delivery record. Any lawful delay must be documented with its legal basis and duration.

Each individual notice must describe what happened and discovery/breach dates if known; the types of health information involved; the names of third parties that acquired or received the information; practical protective steps; what AuricRX is doing to investigate, mitigate and prevent recurrence; and reliable contact methods for questions. Use plain language and avoid unsupported assurances. Counsel verifies content and delivery against 16 CFR 318.4-318.6.

## Working incident record

Record incident ID, discovery date, incident date range, owner/alternate/counsel, systems, data types, affected count and residents by state, recipient names, containment actions, evidence location/access permissions, assessment rationale, user/FTC/media/state deadlines, approved notice versions, delivery dates/receipts, failed deliveries, follow-up tasks and closure decision. Retain the restricted record under a counsel-approved retention schedule; do not put this content into Firebase Analytics, Sentry, chat prompts or ordinary server logs.

## Recovery and prevention

Restore service only after containment and verification of authorization boundaries. Honor consent withdrawals/deletion requests; coordinate processor backup/deletion limitations honestly. Complete a root-cause review, least-privilege and dependency audit, processor-access review, and a consent/notice correction if needed. Test the fix, assign action owners and dates, and conduct a tabletop annually and after material processor/data-flow changes.

References: [16 CFR Part 318](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-318), [FTC health breach form](https://www.ftc.gov/business-guidance/health-breach-form), [2024 amendments](https://www.federalregister.gov/documents/2024/05/30/2024-10855/health-breach-notification-rule). This plan follows docs/legal/US_LEGAL_REVIEW.md; it is not an attorney's opinion.
