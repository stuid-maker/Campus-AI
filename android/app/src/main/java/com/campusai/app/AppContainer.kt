package com.campusai.app

import android.content.Context
import com.campusai.app.core.security.SecureSettingsStore
import com.campusai.app.core.session.SessionStore
import com.campusai.app.core.settings.AppSettingsStore
import com.campusai.app.data.local.AppDatabase
import com.campusai.app.data.remote.OpenAiCompatibleProvider
import com.campusai.app.data.repository.AuthRepository
import com.campusai.app.data.repository.ChatRepository
import com.campusai.app.data.repository.CourseRepository
import com.campusai.app.data.repository.TodoRepository

class AppContainer(context: Context) {
    private val db = AppDatabase.get(context)
    val sessionStore = SessionStore(context)
    val appSettingsStore = AppSettingsStore(context)
    val secureSettingsStore = SecureSettingsStore(context)

    val authRepository = AuthRepository(db.userDao(), sessionStore)
    val courseRepository = CourseRepository(db.courseDao())
    val todoRepository = TodoRepository(db.todoDao())
    val chatRepository = ChatRepository(db.chatDao())
    val aiProvider = OpenAiCompatibleProvider()
}
