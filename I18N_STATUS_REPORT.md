# I18n Translation Status Report
Generated: Nov 10, 2026

## Executive Summary

**CRITICAL ISSUES:**
- 🚨 **Chinese (zh.json)**: Catastrophic corruption - all Chinese characters replaced with `?`
- ⚠️ **German (de.json)**: 26 mojibake corruptions (FIXED)
- ❌ **FR/DE/PT**: ~2,300 missing keys each (39% incomplete)
- ❌ **ZH**: 1,721 missing keys + complete corruption (needs full retranslation)

**TOTAL TRANSLATION WORK REQUIRED:**
- ~8,700+ missing translations across 4 languages
- Complete Chinese retranslation (2,155 keys)
- Professional/native review needed for all legal copy

---

## Detailed Status by Locale

### ✅ English (en.json) - REFERENCE
- **Status:** Complete (100%)
- **Keys:** ~3,800
- **Lines:** 4,001
- **Issues:** None
- **Action:** None - master reference

### ✅ Spanish (es.json) - NEARLY COMPLETE
- **Status:** 98% complete
- **Keys:** ~3,792
- **Missing:** 77 keys (mostly US-specific features)
- **Lines:** 3,993
- **Encoding:** ✅ No issues
- **Placeholders:** ✅ All correct
- **Action:** Add 77 missing US keys

**Missing keys preview:**
```
activityUS.* (36 keys)
usLegal.* (14 keys)
usSmart.* (17 keys)
usOnboarding.* (2 keys)
```

### ❌ French (fr.json) - 61% MISSING
- **Status:** 39% complete
- **Keys:** ~1,485
- **Missing:** 2,308 keys (61%)
- **Lines:** 1,473
- **Encoding:** ✅ No issues
- **Placeholders:** ⚠️ 1 mismatch ({{date}} missing)
- **Action:** **Major translation effort required**

**Top missing sections:**
- All new features (Family Circle, Prevention Planner, Lab Organizer, Daily Habits, Privacy)
- Premium/subscription flows
- Legal compliance copy
- Caregiver alerts
- Cloud backup
- Trial screens

### ❌ German (de.json) - 61% MISSING
- **Status:** 39% complete
- **Keys:** ~1,484
- **Missing:** 2,308 keys (61%)
- **Lines:** 1,387
- **Encoding:** ✅ FIXED (was 26 mojibake corruptions)
- **Placeholders:** ⚠️ 1 mismatch ({{date}} missing)
- **Action:** **Major translation effort required**

**Encoding fixes applied:**
- `â€¦` → `…` (horizontal ellipsis)
- `â€"` → `—` (em dash)
- `Ã¶` → `ö`
- `Ã¼` → `ü`
- `Ã¤` → `ä`

**Same missing sections as French**

### ❌ Portuguese (pt.json) - 61% MISSING
- **Status:** 39% complete
- **Keys:** ~1,478
- **Missing:** 2,312 keys (61%)
- **Lines:** 1,467
- **Encoding:** ✅ No issues
- **Placeholders:** ⚠️ 1 mismatch ({{date}} missing)
- **Action:** **Major translation effort required**

**Same missing sections as French/German**

### 🚨 Chinese (zh.json) - CATASTROPHIC CORRUPTION
- **Status:** 57% complete but **all text corrupted**
- **Keys:** ~1,434 (but all Chinese text is `?`)
- **Missing:** 1,721 keys (43%)
- **Lines:** 2,155
- **Encoding:** 🚨 **COMPLETE CHARACTER LOSS**
- **Placeholders:** ⚠️ 1 mismatch
- **Action:** **COMPLETE RETRANSLATION REQUIRED**

**Corruption examples:**
```json
"language": "????",           // Should be: "语言"
"email": "????",              // Should be: "电子邮件"
"signIn": "??",               // Should be: "登录"
"loading": "???...",          // Should be: "加载中..."
```

**ALL Chinese characters replaced with `?` - original text is LOST**

---

## Translation Requirements

### Priority P0 - Legal/Compliance Copy (MUST BE EXACT)
These require **native legal review** before use in each market:

1. **Cloud backup consent** (Block A from legal review)
   - ES: ✅ Provided by legal
   - FR/DE/PT/ZH: ❌ Need faithful translation + legal review

2. **Family Circle consent flows** (Blocks B1-B5)
   - ES: ✅ Provided by legal
   - FR/DE/PT/ZH: ❌ Need faithful translation + legal review

3. **Caregiver alerts** (Block C)
   - ES: ✅ Provided by legal
   - FR/DE/PT/ZH: ❌ Need faithful translation + legal review

4. **Trial/subscription disclosures** (Block E, F)
   - ES: ✅ Provided by legal
   - FR/DE/PT/ZH: ❌ Need faithful translation + legal review

5. **Plant evidence badges** (Block H)
   - ES: ✅ Provided by legal
   - FR/DE/PT/ZH: ❌ Need faithful translation + legal review

6. **Lab/wearables disclaimers** (Blocks I, J)
   - ES: ✅ Provided by legal
   - FR/DE/PT/ZH: ❌ Need faithful translation + legal review

**⚠️ Legal requirement:** All legal copy in FR/DE/PT/ZH MUST note "Requires native legal review before use in this market"

### Priority P1 - Feature Copy
Standard feature descriptions, UI labels, help text:
- ~2,000+ keys per language
- Natural, human-quality required
- Medical/pharmacy terminology must be accurate

### Priority P2 - Placeholder Fixes
One key per language missing `{{date}}` placeholder:
- `settings.cancelMembershipConfirm` in FR/DE/PT/ZH

---

## Chinese (ZH) Requirements

### Terminology Standards
- **药店** (yàodiàn) - pharmacy
- **化验/检验** (huàyàn/jiǎnyàn) - lab test
- **提醒** (tíxǐng) - reminder
- **处方** (chǔfāng) - prescription
- **剂量** (jìliàng) - dose
- **症状** (zhèngzhuàng) - symptom

### Punctuation
- Use **full-width** Chinese punctuation:
  - `，` not `,`
  - `。` not `.`
  - `！` not `!`
  - `？` not `?`
  - `：` not `:`
  - `「」` for quotes, not `""`

### Text Direction & Rendering
- Simplified Chinese (mainland China)
- Test UI for:
  - No clipped buttons
  - Proper font rendering (CJK fonts)
  - Appropriate line spacing
  - Vertical alignment in buttons

---

## Validation Tool

Created: `scripts/validate-i18n.js`

**Checks:**
- ✅ Missing keys
- ✅ Extra keys
- ✅ Placeholder mismatches
- ✅ Encoding corruption
- ✅ Generates detailed JSON report

**Usage:**
```bash
node scripts/validate-i18n.js
```

**Output:**
- Console summary
- `i18n-validation-report.json` with full details

---

## Action Plan

### Immediate (This PR)
- [x] Create validation script
- [x] Fix German encoding corruption (26 issues)
- [x] Document scope and requirements
- [ ] Add validation to lint/test (package.json)

### Phase 1: Spanish Completion (Small)
**Effort:** ~2 hours (human) or 1 AI pass
- [ ] Add 77 missing US-specific keys
- [ ] Verify all new feature copy

### Phase 2: Legal Copy Translation (Critical)
**Effort:** Professional legal translation required
**Cost:** ~$500-1000 per language (estimate)

For each of FR/DE/PT/ZH:
1. Translate Blocks A-J from legal review
2. Native legal reviewer validates
3. Note in code: "Legal copy - reviewed by [firm] on [date]"
4. **Cannot launch in these markets without this**

### Phase 3: Feature Translation (Major)
**Option A: Professional Translation Service**
- Cost: $0.10-0.25/word × ~15,000 words × 4 languages = $6,000-15,000
- Timeline: 2-4 weeks
- Quality: High, native speakers
- Recommended for production

**Option B: AI-Assisted + Human Review**
- Use GPT-4 or Claude for initial translation
- Native speaker reviews and corrects each language
- Cost: ~$2,000-4,000 (review time)
- Timeline: 1-2 weeks
- Quality: Good with careful review

**Option C: Continue Agent Translation**
- Agent generates translations in chunks
- Native speakers review critical sections
- Cost: Time only
- Timeline: Multiple agent turns + review
- Quality: Variable, needs extensive review

### Phase 4: Chinese Complete Retranslation
**Effort:** Complete retranslation of ~2,155 keys
- All Chinese text is corrupted
- Requires native Simplified Chinese speaker
- Medical terminology expertise needed
- UI testing for text rendering

### Phase 5: Validation & Testing
- [ ] Run validation script (should pass 100%)
- [ ] Visual UI testing in each language
- [ ] Test Chinese text rendering
- [ ] Verify button sizing with long German text
- [ ] Check RTL if adding Arabic later

---

## Recommendations

### For Production Launch:

1. **Spanish (ES):** Complete the 77 missing keys → **Ready**

2. **French/German/Portuguese:** 
   - Use professional translation service for legal copy
   - AI-assisted + review for feature copy
   - **2-4 weeks** before these markets can launch

3. **Chinese (ZH):**
   - Completely retranslate with native speaker
   - Extensive UI testing required
   - **4-6 weeks** before Chinese market launch

### For Internal Testing:

- **OK to proceed** with EN/ES
- FR/DE/PT/ZH will show English fallbacks for missing keys
- Note in test builds: "Non-EN/ES languages incomplete"

### Quality Standards:

- ✅ **Natural, human-quality** translations
- ✅ **Accurate medical/pharmacy** terminology
- ✅ **Consistent** tone and style
- ✅ **Legal copy** reviewed by native legal expert
- ✅ **UI tested** with actual text (no clipping)
- ❌ **NO machine-sounding** literal translations
- ❌ **NO English fallback** in production

---

## Cost/Effort Summary

| Task | Effort | Cost (est.) | Timeline |
|------|--------|-------------|----------|
| ES completion | Low | $0 | 1 day |
| DE encoding fix | Done ✅ | $0 | Done |
| FR/DE/PT legal | Med | $1,500-3,000 | 1-2 weeks |
| FR/DE/PT features | High | $4,000-8,000 | 2-3 weeks |
| ZH complete | Very High | $3,000-6,000 | 3-4 weeks |
| Review & QA | Med | $1,000-2,000 | 1 week |
| **TOTAL** | **Very High** | **$9,500-19,000** | **4-8 weeks** |

---

## Files Changed This Session

1. `scripts/validate-i18n.js` - NEW validation tool
2. `i18n-validation-report.json` - Detailed findings
3. `src/i18n/de.json` - Fixed 26 encoding corruptions
4. `src/i18n/de.json.backup` - Backup before fixes
5. `I18N_STATUS_REPORT.md` - This document

---

## Next Steps

**Owner decision required:**

1. **Launch strategy:** EN/ES only first, or wait for all languages?
2. **Translation approach:** Professional service vs. AI-assisted vs. agent?
3. **Chinese market:** Priority? (requires complete retranslation)
4. **Budget:** Approve professional translation costs?

**Recommended:** Launch with EN/ES, translate FR/DE/PT/ZH in Phase 2 with professional service for legal copy.
