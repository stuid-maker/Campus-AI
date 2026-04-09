# Campus-AI Android

This directory contains the native Android implementation for the VPN-free MVP.

## Stack

- Kotlin + Jetpack Compose
- Room (SQLite local-first persistence)
- DataStore + EncryptedSharedPreferences
- Retrofit (OpenAI-compatible API endpoints)

## Implemented MVP blocks

- Local auth with email/password (hashed password storage)
- Session persistence (DataStore)
- Local schedule/todo/chat storage (Room)
- Configurable model provider settings (Base URL, API key, model)
- Native tabbed UI for Schedule/Todo/Chat/Settings

## Build

1. Open `android/` in Android Studio (Giraffe+ recommended).
2. Let Gradle sync finish.
3. Run app on device/emulator.

## Notes

- API key is stored encrypted with Android Keystore-backed prefs.
- Current AI adapter targets OpenAI-compatible `/v1/chat/completions`.
- OCR and schedule text parsing are planned next extension points.
