package com.campusai.app.core.settings

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore by preferencesDataStore(name = "app_settings")

data class AppSettings(
    val aiName: String = "AI 校园助手",
    val aiPersonality: String = "亲切、准确且有条理",
    val baseUrl: String = "https://generativelanguage.googleapis.com/",
    val model: String = "gemini-2.0-flash"
)

class AppSettingsStore(private val context: Context) {
    private val keyAiName = stringPreferencesKey("ai_name")
    private val keyAiPersonality = stringPreferencesKey("ai_personality")
    private val keyBaseUrl = stringPreferencesKey("base_url")
    private val keyModel = stringPreferencesKey("model")

    val settings: Flow<AppSettings> = context.settingsDataStore.data.map { pref ->
        AppSettings(
            aiName = pref[keyAiName] ?: "AI 校园助手",
            aiPersonality = pref[keyAiPersonality] ?: "亲切、准确且有条理",
            baseUrl = pref[keyBaseUrl] ?: "https://api.openai.com/",
            model = pref[keyModel] ?: "gpt-4o-mini"
        )
    }

    suspend fun save(settings: AppSettings) {
        context.settingsDataStore.edit { pref ->
            pref[keyAiName] = settings.aiName
            pref[keyAiPersonality] = settings.aiPersonality
            pref[keyBaseUrl] = settings.baseUrl
            pref[keyModel] = settings.model
        }
    }
}
