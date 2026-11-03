import uiI18n from "../i18n";
// Herbs data for AuricRx MedCoach
export const herbs = [
  {
    id: 1,
    get name() { return uiI18n.t("ui.echinacea"); },
    get description() { return uiI18n.t("ui.immuneSystemSupportAndColdPrevention"); },
    benefits: [uiI18n.t("ui.boostsImmunity"), uiI18n.t("ui.reducesColdDuration"), uiI18n.t("ui.antiInflammatory")],
    get dosage() { return uiI18n.t("ui.300500mg23TimesDaily"); },
    get precautions() { return uiI18n.t("ui.notRecommendedForAutoimmuneConditions"); }
  },
  {
    id: 2,
    get name() { return uiI18n.t("ui.ginger"); },
    get description() { return uiI18n.t("ui.digestiveAidAndNauseaRelief"); },
    benefits: [uiI18n.t("ui.reducesNausea"), uiI18n.t("ui.aidsDigestion"), uiI18n.t("ui.antiInflammatory")],
    get dosage() { return uiI18n.t("ui.13gDailyInCapsulesOrTea"); },
    get precautions() { return uiI18n.t("ui.mayInteractWithBloodThinners"); }
  },
  {
    id: 3,
    get name() { return uiI18n.t("ui.turmeric"); },
    get description() { return uiI18n.t("ui.antiInflammatoryAndAntioxidantProperties"); },
    benefits: [uiI18n.t("ui.reducesInflammation"), uiI18n.t("ui.supportsJointHealth"), uiI18n.t("ui.antioxidant")],
    get dosage() { return uiI18n.t("ui.5001000mgDailyWithBlackPepper"); },
    get precautions() { return uiI18n.t("ui.mayInteractWithBloodThinners"); }
  },
  {
    id: 4,
    get name() { return uiI18n.t("ui.chamomile"); },
    get description() { return uiI18n.t("ui.calmingAndSleepSupport"); },
    benefits: [uiI18n.t("ui.promotesRelaxation"), uiI18n.t("ui.improvesSleep"), uiI18n.t("ui.digestiveAid")],
    get dosage() { return uiI18n.t("ui.12CupsOfTeaDaily"); },
    get precautions() { return uiI18n.t("ui.mayCauseAllergicReactionsInRagweedAllergy"); }
  },
  {
    id: 5,
    get name() { return uiI18n.t("ui.elderberry"); },
    get description() { return uiI18n.t("ui.immuneSupportAndFluPrevention"); },
    benefits: [uiI18n.t("ui.boostsImmunity"), uiI18n.t("ui.reducesFluSymptoms"), uiI18n.t("ui.antioxidant")],
    get dosage() { return uiI18n.t("ui.1015mlSyrupDailyDuringIllness"); },
    get precautions() { return uiI18n.t("ui.notRecommendedDuringPregnancy"); }
  }
];
