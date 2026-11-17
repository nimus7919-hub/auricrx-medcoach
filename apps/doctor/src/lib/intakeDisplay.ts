import type { IntakeSession, IntakeSummary, BodyPainMarkerPayload } from '@auricrx/doctor-core';
import { parseAppLanguage, type AppLanguage } from './language';

export interface ResolvedIntakeText {
  summary: Pick<IntakeSummary, 'mainConcern' | 'location' | 'duration' | 'alsoMentioned' | 'questionsForDoctor'> | null;
  patientComment: string | null;
  turnText: (turnId: string, original: string) => string;
  markerNote: (index: number, original: string | null) => string | null;
  /** 'translated' → machine-translated into the doctor's language; 'original' → already in it. */
  status: 'original' | 'translated' | 'unavailable';
  /** Language the patient wrote in (what the original text is in). */
  sourceLang: AppLanguage;
  /** When true, the card must show a visible "Written in X" tag (original shown in a different language). */
  showOriginalLanguageTag: boolean;
  /** When true, the card shows a "Translated from X" tag with a show-original toggle. */
  showTranslatedTag: boolean;
}

/**
 * Picks the text the card renders. Server `display` is used only when it was produced for the
 * doctor's current language; otherwise (old server, request failed, language switched) we render
 * the stored original and tag its language so it is never silently mixed in.
 */
export function resolveIntakeText(
  session: IntakeSession,
  doctorLang: AppLanguage,
  showOriginal: boolean
): ResolvedIntakeText {
  const sourceLang = parseAppLanguage(session.locale) || 'es';
  const d = session.display;
  const usable = !!d && parseAppLanguage(d.lang) === doctorLang;

  if (usable && d && d.status === 'translated' && !showOriginal) {
    const turnMap = new Map(d.turns.map((x) => [x.id, x.text] as const));
    return {
      summary: d.summary,
      patientComment: d.patientComment,
      turnText: (id, original) => turnMap.get(id) ?? original,
      markerNote: (i, original) => (d.markerNotes && d.markerNotes[i] != null ? d.markerNotes[i] : original),
      status: 'translated',
      sourceLang: parseAppLanguage(d.sourceLang) || sourceLang,
      showOriginalLanguageTag: false,
      showTranslatedTag: true,
    };
  }

  const originalSummary = session.summary
    ? {
        mainConcern: session.summary.mainConcern,
        location: session.summary.location,
        duration: session.summary.duration,
        alsoMentioned: session.summary.alsoMentioned,
        questionsForDoctor: session.summary.questionsForDoctor,
      }
    : null;
  const differs = sourceLang !== doctorLang;
  const translatedButShowingOriginal = usable && !!d && d.status === 'translated' && showOriginal;
  return {
    summary: originalSummary,
    patientComment: session.patientComment,
    turnText: (_id, original) => original,
    markerNote: (_i, original) => original,
    status: usable && d ? (translatedButShowingOriginal ? 'original' : d.status) : 'original',
    sourceLang,
    showOriginalLanguageTag: differs,
    showTranslatedTag: false,
  };
}

export function hasTranslation(session: IntakeSession, doctorLang: AppLanguage): boolean {
  const d = session.display;
  return !!d && d.status === 'translated' && parseAppLanguage(d.lang) === doctorLang;
}

/** i18n key for the speaker of a chat turn (never print the raw role id). */
export function speakerKey(role: string): string {
  return role === 'patient' || role === 'assistant' ? `doctorMode.preVisitIntake.speakers.${role}` : 'doctorMode.preVisitIntake.speakers.system';
}

/** Body-map names come from the stable ids so they always follow the doctor's language. */
export function regionKey(regionId: string): string {
  return `doctorMode.preVisitIntake.bodyMap.regions.${regionId}`;
}
export function layerKey(layer: string): string {
  return `doctorMode.preVisitIntake.bodyMap.layers.${layer}`;
}

type TFn = (key: string, opts?: Record<string, unknown>) => string;

/**
 * Doctor-language region/layer label. If an id is unknown (new region on a newer patient app),
 * fall back to the stored label and report that it is in the patient's language.
 */
export function markerLabels(m: Pick<BodyPainMarkerPayload, 'layer' | 'regionId' | 'layerLabel' | 'regionLabel'>, t: TFn) {
  const region = t(regionKey(m.regionId), { defaultValue: '' });
  const layer = t(layerKey(m.layer), { defaultValue: '' });
  return {
    region: region || m.regionLabel,
    layer: layer || m.layerLabel,
    regionFromPatientLanguage: !region,
    layerFromPatientLanguage: !layer,
  };
}
