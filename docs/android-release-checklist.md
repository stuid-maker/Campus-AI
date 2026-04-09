# Android Release Checklist

## Build and Signing

- [ ] Generate release keystore (`keytool`) and store securely.
- [ ] Configure `signingConfigs` in `android/app/build.gradle.kts`.
- [ ] Build signed APK and AAB.
- [ ] Verify install/update path on physical device.

## Functional QA

- [ ] Cold start without network works.
- [ ] Register/login/logout works with local account.
- [ ] Session remains after process kill and restart.
- [ ] Schedule CRUD works offline.
- [ ] Todo CRUD/toggle works offline.
- [ ] Chat history persists locally.
- [ ] AI provider configuration can be saved and read.
- [ ] Invalid model endpoint shows friendly errors.

## Security and Privacy

- [ ] API key is only stored in encrypted preferences.
- [ ] Crash logs do not print API keys.
- [ ] Privacy policy includes local data + model API behavior.
- [ ] Permissions minimized (`INTERNET` only for MVP).

## Distribution

- [ ] Package name and app name finalized.
- [ ] Versioning strategy set (`versionCode`, `versionName`).
- [ ] Basic app icon and launch assets added.
