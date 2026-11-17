/**
 * Exception-first morning digest — descriptive only.
 * Surfaces patients with: new symptom, missed dose, doctor-limit crossed, new document.
 * Sorted by recency. Never ranks by risk or health status.
 */

export type DigestExceptionKind =
  | 'new_symptom'
  | 'missed_dose'
  | 'limit_crossed'
  | 'new_document';

export interface DigestExceptionEvent {
  patientId: string;
  patientLabel?: string;
  kind: DigestExceptionKind;
  at: string; // ISO
  /** Descriptive detail only (raw value / verbatim symptom / doc name). */
  detail?: string;
}

export interface MorningDigestItem {
  patientId: string;
  patientLabel?: string;
  latestAt: string;
  kinds: DigestExceptionKind[];
  events: DigestExceptionEvent[];
}

export function buildMorningDigest(events: DigestExceptionEvent[]): MorningDigestItem[] {
  const byPatient = new Map<string, DigestExceptionEvent[]>();
  for (const e of events) {
    if (!e?.patientId || !e?.at || !e?.kind) continue;
    const list = byPatient.get(e.patientId) || [];
    list.push(e);
    byPatient.set(e.patientId, list);
  }

  const items: MorningDigestItem[] = [];
  for (const [patientId, list] of byPatient) {
    const sorted = [...list].sort((a, b) => b.at.localeCompare(a.at));
    const kinds = [...new Set(sorted.map((e) => e.kind))];
    items.push({
      patientId,
      patientLabel: sorted.find((e) => e.patientLabel)?.patientLabel,
      latestAt: sorted[0].at,
      kinds,
      events: sorted,
    });
  }

  // Recency only — never by inferred severity
  return items.sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}
