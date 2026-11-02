# Legal Documents - Terms of Service & Privacy Policy

This directory contains the Terms of Service and Privacy Policy in all supported languages.

## Files

- `TermsOfService-en.md` - English
- `TermsOfService-es.md` - Spanish (Español)
- `TermsOfService-pt.md` - Portuguese (Português)  
- `TermsOfService-fr.md` - French (Français)
- `TermsOfService-de.md` - German (Deutsch)
- `TermsOfService-zh.md` - Chinese (中文)
- `consentCheckboxText.json` - Short consent checkbox text for sign-up forms in all languages

## Usage

### Display Full Terms
Load the appropriate language file based on user's language preference.

### Sign-Up Checkbox
Use `consentCheckboxText.json` to get the short consent text for the sign-up form checkbox.

Example:
```javascript
import consentTexts from './src/legal/consentCheckboxText.json';

const userLang = 'es'; // or get from user settings
const checkboxText = consentTexts[userLang] || consentTexts['en'];
```

## Note

All documents follow the same structure:
1. Terms of Service (sections 1-17)
2. Privacy Policy (sections P1-P12)
3. Appendix (Processors list)
4. Short-form disclaimers for UI

Replace placeholders:
- `[Company Legal Name]`
- `[jurisdiction]`
- `[street address]`
- `[contact email]`
- `[privacy@yourdomain]`
- `[support@yourdomain]`
- `[City, State]` (for arbitration)
- `[Chosen Venue]`


