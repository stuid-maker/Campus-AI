# Campus-AI Android MVP Spec

## Product Goal

Build a native Android app that works without VPN and does not rely on browser redirects, Firebase, or Google-only services.

## In Scope (MVP)

- Native Android app built with Kotlin + Jetpack Compose.
- Local account registration/login using email + password.
- Local-first data storage using Room (SQLite).
- Core features:
  - Schedule (course CRUD, week filtering)
  - Todo (CRUD + completion toggle)
  - Chat (message history, model response)
  - Settings (provider configuration, AI persona)
- Configurable AI provider:
  - Base URL
  - API key
  - Model name
- API key encrypted at rest with Android Keystore-backed storage.
- Offline-first behavior for schedule/todo/chat history read and write.

## Out of Scope (MVP)

- Cloud sync across devices.
- Google/Firebase authentication.
- Firebase Firestore and storage.
- Browser-based login redirect flows.
- iOS support.

## Acceptance Criteria

1. App launches directly into native UI (no browser/webview entry screen).
2. User can register/login locally and keep session after app restart.
3. User can create/read/update/delete schedule and todo entries offline.
4. User can chat using configured model endpoint if network is available.
5. API key is not stored in plain text.
6. App remains usable offline for non-AI modules.

## Technical Constraints

- Min SDK: 26
- Target SDK: 35
- Kotlin JVM target: 17
- Architecture: MVVM + Repository + Room + Retrofit

## Release Gate

- Manual test pass on at least one real Android device.
- No crash on cold start without network.
- No dependency on VPN-only services in critical path.
