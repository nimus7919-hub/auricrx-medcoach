# AuricRX MedCoach — US version review (Auric RX Legal, 3 Nov 2026)
I'm not a licensed lawyer, so treat this as a compliance checklist and not legal advice. A US attorney should confirm it before any public US release. UNVERIFIED = I couldn't confirm it on an official page.

## Bottom line
1. A family-only beta is low risk if you ship it through **Google Play internal testing or a closed test, or through TestFlight internal testers**. It isn't a public launch, but the FTC rules and state health-privacy laws still apply to any US user's data.
2. **FDA:** keep the app as an information and wellness tool. Personalized "this drug + this drug/herb = risk for you" alerts and AI answers that tell a user what to do about a disease are patient-facing decision support. FDA's non-device CDS exemption covers only tools for health-care professionals (HCPs), not patients. So the wording has to stay at "sourced information plus ask your pharmacist."
3. **Biggest blockers for a public US launch:**
   - Apple guideline 5.1.1(ix) says healthcare apps should be submitted by a legal entity, so you'll likely need an organization account with a D-U-N-S number.
   - The WA My Health My Data Act needs separate consents and a separate Consumer Health Data Privacy Policy.
   - You need a breach plan under the FTC Health Breach Notification Rule.
   - Cost Plus prices can't be shown until you have permission.

## 1. FDA
- **CDS guidance (rev. Jan 29, 2026):** FD&C 520(o)(1)(E) / Cures Act sec. 3060 exclude CDS software only when all 4 criteria are met:
  - (1) it doesn't analyze images or signals;
  - (2) it displays or analyzes medical information;
  - (3) it supports **an HCP's** recommendation;
  - (4) **the HCP** can independently review the basis for it.

  FDA says its existing digital-health policies still apply to patient- or caregiver-facing functions, so **our app can't use the CDS exemption**. https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software (PDF https://www.fda.gov/media/109618/download)
- **General Wellness guidance (rev. Jan 2026):** low-risk wellness products, including wearable readouts, stay outside FDA oversight when they:
  - make no disease-specific claims;
  - don't call a reading "abnormal" or diagnostic;
  - use no clinical thresholds;
  - give no treatment advice;
  - don't monitor or manage a disease.

  https://www.fda.gov/media/90652/download . This matches our Health Connect/HealthKit decision (neutral numbers only).
- **Policy for Device Software Functions and Mobile Medical Apps:** FDA uses enforcement discretion for apps that help patients organize and track health information, set medication reminders, or look up drug–drug interactions and reference information. https://www.fda.gov/regulatory-information/search-fda-guidance-documents/policy-device-software-functions-and-mobile-medical-applications
  - UNVERIFIED: I couldn't open the full text this turn to confirm the exact example list. FDA plans to revise this guidance in FY26 (per law-firm summaries, also UNVERIFIED).
- **Features that stay low risk:** reminders, document storage, label lookup (DailyMed), recall lists (openFDA), interaction *lookup* that shows the source text, herb facts with "evidence is limited," wellness charts, and price guides.
- **Features that move toward SaMD:**
  - risk scores or severity for one patient ("high risk for YOU");
  - dosing changes;
  - "stop/start/switch" advice;
  - symptom → condition or probability outputs (already removed in MX item 7);
  - alerts driven by wearable readings;
  - AI chat that diagnoses or triages.
- **Wording rules (English):**
  - Use "information," "may," "the label says," "ask your pharmacist or doctor."
  - Never use "safe," "no interaction," "diagnose," "treat," "you should stop/take/increase," "clinically proven," or "doctor-approved."
  - Show the source and date on every alert.
  - No green "safe" state. When nothing is found, say "No interaction found in [source] as of [date]. This does not mean the combination is safe."

## 2. Privacy
- **HIPAA:** likely does NOT apply. The app isn't a health plan, clearinghouse, or provider billing electronically, and it isn't a business associate of one (45 CFR 160.103). Have a US attorney confirm.
- **FTC Health Breach Notification Rule (16 CFR 318, amendments effective July 29, 2024):** covers non-HIPAA health apps that draw data from multiple sources (for example user entries + wearables + APIs).
  - A "breach" includes **unauthorized disclosure**, such as sending data to ad or analytics SDKs without authorization, not just hacks.
  - Notify users without unreasonable delay and **no later than 60 days**.
  - Notify the FTC at the same time if 500 or more people are affected; otherwise log it and report within 60 days after year-end.
  - The notice must name the third parties that got the data.
  - https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-318 ; https://www.federalregister.gov/documents/2024/05/30/2024-10855/health-breach-notification-rule ; https://www.ftc.gov/business-guidance/health-breach-form
- **FTC Act sec. 5 (unfair or deceptive practices):** the GoodRx (2023), BetterHelp (2023) and Flo Health (2021) actions involved sharing health data with advertising or analytics platforms (Facebook/Google pixels or SDKs) against the companies' own privacy promises.
  - **Rule:** no ad or tracking SDKs and no health data in analytics events.
  - Make the privacy policy match the app exactly.
  - Get express consent before any new sharing.
  - Case details UNVERIFIED this turn (ftc.gov pages not opened): https://www.ftc.gov/legal-library/browse/cases-proceedings/2023090-goodrx-holdings-inc ; https://www.ftc.gov/legal-library/browse/cases-proceedings/2023169-betterhelp-inc-matter ; https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3133-flo-health-inc
- **Washington My Health My Data (RCW 19.373):** applies to anyone who targets or processes WA consumers' health data. There is no size threshold, and individuals can sue.
  - Required:
    - (a) a separate **Consumer Health Data Privacy Policy**, linked on its own from the homepage and the app;
    - (b) opt-in consent **before collection**, and a **separate** consent before sharing;
    - (c) a signed authorization before any sale (just never sell);
    - (d) rights to access, delete, and withdraw consent;
    - (e) no geofence within 2,000 ft of health-care facilities (RCW 19.373.080, UNVERIFIED this turn).
  - https://app.leg.wa.gov/RCW/default.aspx?cite=19.373&full=true ; https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy
- **Nevada SB 370 (NRS 603A) and Connecticut (Gen. Stat. 42-515 to 42-526):** similar consumer-health-data consent rules and no-geofence rules. Nevada has no private lawsuit right. Following the WA approach covers most of both (details partly UNVERIFIED, carried over from the Mexico review).
- **CCPA/CPRA:** applies only to a "business" that has more than $26,625,000 in gross revenue (2025 figure), OR buys/sells/shares the personal information of 100,000+ consumers, OR gets 50%+ of its revenue from selling or sharing data. **Not met now.** Review again if you grow. https://cppa.ca.gov/regulations/cpi_adjustment.html
- **California CMIA (Civ. Code 56.10 / 56.06):** treats some businesses that offer software "designed to maintain medical information" for a user to manage their own health as providers of health care.
  - That could cover the documents and medications features. It requires confidentiality and consent before disclosure.
  - UNVERIFIED: whether it applies to us. Ask the US attorney.
- **Consent design (US mode):**
  - Screen A: consent to collect health data (medications, documents, herbs, wearables).
  - Screen B: separate consent to share with our processors (OpenAI for chat, Neon/Render hosting), naming them.
  - Each is its own checkbox, unticked by default, and can be withdrawn in Settings.
  - Location/weather reminders: do the processing on the phone; never geofence around clinics or pharmacies.

## 3. Data sources, terms and attribution
| Source | Terms | Can we show it? | Required text |
|---|---|---|---|
| openFDA | CC0 public domain; "as is," no warranty; rate limits | Yes | "Data provided by the U.S. Food and Drug Administration (https://open.fda.gov). FDA does not endorse this app." https://open.fda.gov/terms/ |
| RxNorm | Normalized names and RXCUIs are public domain. The **full** release includes proprietary sources and needs a free **UMLS license** (restriction levels in UMLS sec. 12). Don't use the NLM name or logo or imply endorsement. Keep data current or say it's not current. | Yes. Use RxNav APIs or the "Current Prescribable Content" subset (no UMLS license needed for that subset: UNVERIFIED, confirm at https://www.nlm.nih.gov/research/umls/rxnorm/docs/prescribe.html) | "This product uses publicly available data courtesy of the U.S. National Library of Medicine (NLM), National Institutes of Health, Department of Health and Human Services; NLM is not responsible for the product and does not endorse or recommend this or any other product." https://www.nlm.nih.gov/research/umls/rxnorm/docs/termsofservice.html |
| Interactions | NLM retired the RxNav Drug Interaction API in Jan 2024 (UNVERIFIED this turn) | Use the label text (DailyMed "Drug Interactions" section) instead of a home-built severity score | Cite source + date |
| DailyMed (NLM) | SPL labels are public. NLM terms apply (no endorsement). UNVERIFIED: no specific license page opened | Yes, as label text with a link | "Label information from DailyMed (dailymed.nlm.nih.gov), U.S. National Library of Medicine. Last updated [date]." |
| NADAC (CMS) | U.S. government data on data.medicaid.gov. No NADAC-specific license found (UNVERIFIED) | Yes, but it's a **pharmacy acquisition cost**, NOT the price the user pays | "NADAC is the average price pharmacies pay to buy a drug, published weekly by CMS (data.medicaid.gov). It is not what you will pay at the pharmacy and does not include dispensing fees or insurance. CMS does not endorse this app. Data as of [date]." https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704 |
| NPPES NPI | Public CMS registry (data dissemination). Records are self-reported | Yes, for pharmacy name, address and phone | "Pharmacy listings from the CMS NPPES NPI Registry; information is provided by the pharmacies and may be out of date." https://npiregistry.cms.hhs.gov/ (terms UNVERIFIED) |
| Mark Cuban Cost Plus | **UNVERIFIED.** The terms page renders by script and I couldn't read it. robots.txt allows /medications/ but that's not a license | **Don't scrape or store prices.** Show a "Check price at Cost Plus Drugs" link only, or get written permission/API access | "Cost Plus Drugs is a trademark of its owner; AuricRX is not affiliated." |

General price disclaimer: "Prices are estimates for information only, may be out of date, and are not an offer. Your actual cost depends on your pharmacy, insurance, and quantity. Confirm with the pharmacy."

## 4. AI chat (US)
- **California AB 489 (Ch. 615, Stats. 2025; B&P 4999.8–4999.9, operative Jan 1, 2026):** AI may not use titles, terms, or design that suggest a licensed health professional is giving the care or advice. Each use counts as a separate violation. Our "no Dr./nurse, AI badge" decision fits. Also avoid "Dr. Alfred," "RN," "clinician," "prescribe," and "consult with Alfred." https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB489
- **Utah Code 13-77-103/104:** say it's AI when asked. The safe harbor is a clear disclosure at the start *and throughout* the chat that it's AI and not a human, which our persistent banner does. https://le.utah.gov/xcode/Title13/Chapter77/C13-77%5F2025050820250508.pdf
  - Utah 13-72a (mental-health chatbots, HB 452) applies only if the chat acts like therapy. Don't.
- **Illinois 225 ILCS 155 (HB 1806, eff. Aug 1, 2025):** no AI therapy or psychotherapy offered to the public; fines up to $10,000. https://www.ilga.gov/documents/legislation/104/HB/PDF/10400HB1806enr.pdf
- **Nevada AB 406 (2025):** AI may not claim to provide mental or behavioral health care or call itself a therapist, counselor, or doctor; fines up to $15,000. (From secondary summaries; official text UNVERIFIED.)
  - Mimi is a "wellness guide." She must not do counseling. When a user brings up a mental-health topic, she gives a short supportive line and points to 988 and a professional.
- **California SB 243 (companion chatbots, B&P 22601+, eff. Jan 1, 2026):** requires a crisis-referral protocol for suicide or self-harm talk. It probably doesn't apply, because our personas aren't "companion" bots (UNVERIFIED applicability). Build the protocol anyway. https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?chapter=22.6&division=8.&lawCode=BPC
- **Required crisis text (EN):** "If you think you are having a medical emergency, call 911 now. If you are thinking about suicide or are in emotional distress, call or text 988 (Suicide & Crisis Lifeline). For a possible poisoning or overdose, call Poison Control at 1-800-222-1222." Show it as a banner when the trigger keywords appear, and always in Settings > Help. (988: https://988lifeline.org ; Poison Help: https://www.poison.org — numbers are well-established, page not opened this turn.)

## 5. App stores
- **Apple:**
  - An individual account doesn't need a D-U-N-S number; an organization account does, and it must belong to a legal entity (DBAs aren't accepted). https://developer.apple.com/help/account/membership/D-U-N-S
  - **Guideline 5.1.1(ix):** apps in highly regulated fields such as healthcare "should be submitted by a legal entity that provides the services." That's a risk for an individual account in App Review. https://developer.apple.com/app-store/review/guidelines/
  - 1.4.1: the app must disclose its data and methods and remind users to check with a doctor.
  - HealthKit data: never for ads, never stored in iCloud, never shared with third parties without consent (5.1.3).
  - **TestFlight:** up to 100 internal testers who are App Store Connect users, with no Beta App Review. External testers (up to 10,000) need **Beta App Review** for the first build. https://developer.apple.com/testflight/
- **Google Play:**
  - Organization accounts need a D-U-N-S number; personal accounts don't. https://support.google.com/googleplay/android-developer/answer/13628312
  - New personal accounts must run a **closed test with 12+ testers for 14 days** before production. https://support.google.com/googleplay/android-developer/answer/14151465
  - **Internal testing (up to 100) is fine for the family.**
  - Health apps must:
    - complete the Health apps declaration;
    - follow the Health Connect permissions policy and the limited-use rules;
    - have a matching Data safety form;
    - add the "not a medical device" disclaimer for non-medical apps (UNVERIFIED exact wording).

    https://support.google.com/googleplay/android-developer/answer/16679511
- **A sideloaded preview APK** isn't covered by store rules, but privacy laws still apply. Give testers the same consent screens, avoid shipping the Expo dev client with the extra permissions (SYSTEM_ALERT_WINDOW, DUMP, storage, boot), and remove it before release.
- **EU DSA trader status:** only matters if you distribute in the EU. For a US-only release it's not needed, but Apple asks during setup. Choose US + MX only.

## 6. English disclaimers (exact text)
- **Global footer:** "AuricRX MedCoach provides general health information and reminders. It is not a medical device and does not diagnose, treat, cure, or prevent any disease. It is not a substitute for advice from your doctor or pharmacist. In an emergency, call 911."
- **AI chat banner (always visible):** "AI assistant, not a doctor or a human. Answers can be wrong. Check with your doctor or pharmacist before changing any medication."
- **Interaction screen:** "Information from [DailyMed/NLM], last updated [date]. Not a complete list. No result does not mean a combination is safe. Ask your pharmacist."
- **Herbs:** "Herbs and supplements are not reviewed by the FDA for safety or effectiveness. Evidence is limited. Tell your doctor or pharmacist about every supplement you take."
- **Wearables:** "For general wellness only. These numbers are not medical measurements and are not checked for problems. Talk to a doctor about any health concern."
- **Recalls/adverse events:** "Adverse event reports are unverified and do not prove a drug caused a problem. Source: openFDA. Don't stop a medication without talking to your doctor."
- **Prices:** see the table above.

## Privacy policy outline (US) — 2 documents
**A. Privacy Policy**
1. Who we are (Adriana Hernandez, Mexico; contact email; no US entity yet)
2. Data we collect
3. Why
4. Processors (Firebase/Google, Render, Neon, OpenAI, Apple/Google billing)
5. No sale, no targeted ads
6. Health Connect/HealthKit kept on the device, never sent to AI
7. Retention
8. Security and breach notice (FTC HBNR)
9. Your rights and how to delete your account
10. Children: 18+ only
11. International transfer (data processed in the US/Mexico)
12. Changes
13. Contact

**B. Consumer Health Data Privacy Policy (WA/NV/CT)**, linked separately:
- categories of health data;
- sources;
- purposes;
- categories shared and recipients;
- how to exercise rights and appeal;
- consent withdrawal.

## 7. Entity and tax
- **Store payouts:** as a non-US individual, submit **Form W-8BEN** in App Store Connect and in the Play Console payments profile. Claim the US–Mexico treaty rate on royalties. https://developer.apple.com/help/app-store-connect/manage-tax-information/provide-tax-information/ ; https://support.google.com/googleplay/android-developer/answer/7163598 ; https://www.irs.gov/instructions/iw8ben
  - The Mexico treaty rate is UNVERIFIED; check with a tax advisor.
- **US LLC:** not legally required to sell through the stores. Apple 5.1.1(ix) pushes healthcare apps toward a legal entity, though, and an entity also limits personal liability.
  - A Mexican S.A.S./S.A. de C.V. with a D-U-N-S number may be enough for Apple. Ask the attorney whether a Mexican company or a US LLC is better.
  - A US LLC owned by a foreigner brings filing duties (Form 5472, an EIN). UNVERIFIED details.
- **Sales tax:** Apple and Google collect and remit US sales tax on in-app sales as marketplace facilitators. UNVERIFIED on an official page this turn.
- **Stripe US:** opening a US Stripe account generally needs a US entity or US person details. A Mexican Stripe account can charge US cards. Digital in-app features must use StoreKit/Play Billing anyway (Apple 3.1.1, Play Payments). UNVERIFIED Stripe specifics.

## Prioritized change list (for Auric RX Tech — needs Adriana's approval before any code)
| # | P | File/area | Change | Source |
|---|---|---|---|---|
| U1 | P0 | Distribution | US family = Play internal testing / TestFlight internal only; no public US listing until an entity and attorney review exist. Don't distribute the Expo dev-client APK | developer.apple.com/testflight ; support.google.com/googleplay/android-developer/answer/14151465 |
| U2 | P0 | src/i18n/en.json, AIHealthScreen.tsx | Persistent AI banner + per-session intro (EN text above); no "Dr./nurse/therapist/clinician" anywhere in persona strings, art or store copy | leginfo AB489 ; le.utah.gov 13-77-104 |
| U3 | P0 | aiHealthService.ts, server/aI-stream.js | US crisis keywords (EN: suicide, kill myself, overdose, chest pain, can't breathe, poison…) → 911 / 988 / 1-800-222-1222 banner; system prompt: no diagnosis, no dosing, no therapy, refer to pharmacist/doctor | 225 ILCS 155; NV AB406; SB243 |
| U4 | P0 | Interactions screen/service | Show label text + source + date only; remove severity/"safe" states; "No result ≠ safe" text; don't personalize risk | FDA CDS guidance; MMA policy |
| U5 | P0 | Consent flow (US mode) | Two separate unticked opt-ins (collect / share-with-processors) before any health data; withdraw in Settings | RCW 19.373.030 |
| U6 | P0 | Analytics/SDKs | Confirm no ad/tracking SDKs; no health data in Firebase Analytics events or logs | 16 CFR 318; FTC GoodRx/BetterHelp |
| U7 | P0 | Breach plan doc | US breach playbook: 60-day user notice, FTC form (≥500 contemporaneous), name third parties | ecfr 16 CFR 318.4-318.6 |
| U8 | P0 | PriceCard.tsx, pricing service | Remove any Cost Plus scraping/storage; link-out only until written permission. NADAC labeled "pharmacy acquisition cost, not your price" + date | costplusdrugs.com/terms (UNVERIFIED); data.medicaid.gov |
| U9 | P1 | src/legal/ (new EN docs) | Privacy Policy + separate Consumer Health Data Privacy Policy (outline above), linked from app & store listing | RCW 19.373.020; atg.wa.gov |
| U10 | P1 | About/Sources screen | Attribution: openFDA, NLM/RxNorm statement verbatim, DailyMed, CMS NADAC, NPPES; "not endorsed" | open.fda.gov/terms ; nlm.nih.gov RxNorm ToS |
| U11 | P1 | RxNorm integration | Use RxNav API / prescribable subset; no proprietary UMLS sources without UMLS license; show data date | nlm.nih.gov RxNorm ToS |
| U12 | P1 | HealthAnalyticsScreen.tsx, healthMetrics.ts | Keep neutral numbers; add wellness disclaimer (EN); HealthKit data never to OpenAI/ads/iCloud | FDA General Wellness 2026; Apple 5.1.3 |
| U13 | P1 | Location/weather reminders | On-device only; no geofence near health facilities; separate location permission explanation | RCW 19.373.080; NV/CT |
| U14 | P1 | Herbs (EN) | Port MX herb rules to English + FDA supplement disclaimer | FTC Act §5; FDA wellness |
| U15 | P1 | Recalls/adverse events | Adverse-event disclaimer text above; link to FDA source | open.fda.gov |
| U16 | P1 | Store listings / Data safety / App Privacy | Health apps declaration, Health Connect declaration, Data safety and Apple nutrition label matching actual flows; no medical claims | Play 16679511; Apple 5.1.1/1.4.1 |
| U17 | P2 | Account/entity (owner decision) | Decide org account (Mexican company or US LLC) + D-U-N-S before public US release | Apple D-U-N-S help; Apple 5.1.1(ix); Play 13628312 |
| U18 | P2 | Tax (owner) | Submit W-8BEN in App Store Connect & Play; confirm treaty rate with advisor | irs.gov iw8ben |
| U19 | P2 | Age gate | 18+ in US mode too (no COPPA flows) | carry-over MX item |
| U20 | P2 | Monitoring | Re-check CCPA thresholds, CMIA applicability, FDA MMA guidance revision (FY26) | cppa.ca.gov |

## Questions for a US attorney
1. Is the interaction lookup and AI chat within FDA enforcement discretion or general wellness, or is it device software?
2. Does CA CMIA 56.06 apply?
3. Does WA/NV/CT law apply to a family beta?
4. Which entity: Mexican company or US LLC?
5. Does the treaty rate apply?
6. Can we get permission from Cost Plus?
7. Does SB 243 apply?
