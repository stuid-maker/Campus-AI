package com.campusai.app.core.session

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.sessionDataStore by preferencesDataStore(name = "session_store")

class SessionStore(private val context: Context) {
    private val keyUserEmail = stringPreferencesKey("current_user_email")

    val currentUserEmail: Flow<String?> = context.sessionDataStore.data.map { it[keyUserEmail] }

    suspend fun setCurrentUser(email: String) {
        context.sessionDataStore.edit { it[keyUserEmail] = email }
    }

    suspend fun clear() {
        context.sessionDataStore.edit { it.remove(keyUserEmail) }
    }
}
