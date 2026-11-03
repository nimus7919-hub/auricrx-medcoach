Android document scanning uses Google's maintained `play-services-mlkit-document-scanner:16.0.0` directly, pinned in `android/app/build.gradle`. A small app-owned React Native bridge exposes `GmsDocumentScanning` through RN 0.79's native module interop, including the enabled new architecture. There is no npm scanner dependency or config plugin to install; this repository builds its committed Android project. Preserve the bridge, package registration, and Gradle dependency if regenerating that project.

The full scanner enables automatic capture, edge detection, crop/perspective correction, gallery import, and up to 100 pages. Front/back actions allow one page per side. Native cancellation exits without opening the fallback. iOS, older builds, missing Google Play services, unsupported devices, and scanner initialization failures use the existing camera/photo flow. Google Play services may download the scanner on first use.

Pages go through `src/lib/documentPdf.ts` for actual PDFs with the existing branded header/footer. Medical document scans save a PDF immediately. ID sides retain durable image originals for the existing paired thumbnail layout and save a branded PDF in `pdfUri`; viewing/sharing a completed pair builds the combined front/back PDF from those originals. The Documents screen retains its page ordering/export flow.

The launcher, splash and notification resources can be regenerated with `python scripts/regenerate-android-brand-icons.py` (Pillow required). This does not run prebuild or change adaptive icon XML structure.

A new Android EAS build is required. Device checks after installation:

- Scan multiple pages and import a gallery image; inspect edge correction and the exported PDF header/footer.
- Capture both ID sides; view/share the paired PDF and reopen after restarting the app.
- Cancel scanning; verify no camera opens and no document is added.
- Test without Google Play services and on iOS to confirm the camera/photo fallback.
- Inspect launcher, round launcher, splash and a delivered notification for the new A/pill artwork.
