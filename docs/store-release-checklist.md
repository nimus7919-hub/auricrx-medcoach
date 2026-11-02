# Item 11: production availability and family testing

TODO(OWNER-DECISION): Confirm whether production launch is Mexico-only. Current availability has not been changed or assumed. Record approval and screenshots here before release.

- [ ] Owner records launch-country decision and approver/date.
- [ ] If Mexico-only is approved: in App Store Connect set production country/region availability to Mexico only; disable automatic inclusion of new regions. Check the saved distribution settings.
- [ ] If approved: in Play Console production country availability select Mexico only; check saved settings and active releases.
- [ ] Distribute US family builds through TestFlight or Play internal testing. Do not enable US production availability implicitly.
- [ ] TestFlight internal testing supports up to 100 App Store Connect users with appropriate roles. Family without those roles should use external testing (up to 10,000 testers), with required Beta App Review.
- [ ] Play internal testing supports up to 100 testers; configure the email list and send the opt-in URL. Confirm internal-track country exceptions in the console.
- [ ] Verify consent, privacy documents, emergency guidance, deletion and incident response also cover actual US beta users. Geographic availability is not a substitute for those duties.
- [ ] Publish `/account-deletion` on the deployed Express host, verify it without authentication, and add that URL to Play Console and relevant store/support links.
- [ ] Include the `docs/` directory in the server deployment artifact (the deletion HTML/JS routes serve those files). Authorize the deployed hostname in Firebase Authentication for web Google sign-in. Verify both email/password and Google deletion from a browser using disposable accounts.
- [ ] Apply `server/migrate-consents.sql` before deploying the backend. Verify signup, Google consent, withdrawal, and deletion against a disposable staging account.

Sources checked November 2, 2026: [Apple TestFlight](https://developer.apple.com/testflight/), [Google test tracks](https://support.google.com/googleplay/android-developer/answer/9845334).

TODO(OWNER-DECISION): Pro price remains the existing code value (MXN 50); business plan says MXN 79. Item 13 is outside this run.

TODO(OWNER-DECISION): Supply the real legal entity name, full address, phone and privacy/breach email. Existing operator values are unchanged. Do not publish placeholder contact details as verified facts.
