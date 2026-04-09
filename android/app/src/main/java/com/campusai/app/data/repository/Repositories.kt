package com.campusai.app.data.repository

import com.campusai.app.core.security.PasswordHasher
import com.campusai.app.core.session.SessionStore
import com.campusai.app.data.local.dao.ChatDao
import com.campusai.app.data.local.dao.CourseDao
import com.campusai.app.data.local.dao.TodoDao
import com.campusai.app.data.local.dao.UserDao
import com.campusai.app.data.local.entity.ChatMessageEntity
import com.campusai.app.data.local.entity.CourseEntity
import com.campusai.app.data.local.entity.TodoEntity
import com.campusai.app.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

class AuthRepository(
    private val userDao: UserDao,
    private val sessionStore: SessionStore
) {
    suspend fun register(email: String, password: String): Result<Unit> = runCatching {
        check(email.contains("@")) { "邮箱格式不正确" }
        check(password.length >= 6) { "密码至少 6 位" }
        val exists = userDao.findByEmail(email.trim())
        check(exists == null) { "该邮箱已注册" }
        userDao.create(UserEntity(email = email.trim(), passwordHash = PasswordHasher.hash(password)))
        sessionStore.setCurrentUser(email.trim())
    }

    suspend fun login(email: String, password: String): Result<Unit> = runCatching {
        val user = userDao.findByEmail(email.trim()) ?: error("用户不存在")
        check(PasswordHasher.verify(password, user.passwordHash)) { "密码错误" }
        sessionStore.setCurrentUser(user.email)
    }

    suspend fun logout() {
        sessionStore.clear()
    }

    val currentUserEmail = sessionStore.currentUserEmail
}

class CourseRepository(private val dao: CourseDao) {
    fun observe(userEmail: String): Flow<List<CourseEntity>> = dao.observeByUser(userEmail)
    suspend fun add(item: CourseEntity) = dao.insert(item)
    suspend fun remove(item: CourseEntity) = dao.delete(item)
}

class TodoRepository(private val dao: TodoDao) {
    fun observe(userEmail: String): Flow<List<TodoEntity>> = dao.observeByUser(userEmail)
    suspend fun add(item: TodoEntity) = dao.insert(item)
    suspend fun update(item: TodoEntity) = dao.update(item)
    suspend fun remove(item: TodoEntity) = dao.delete(item)
}

class ChatRepository(private val dao: ChatDao) {
    fun observe(userEmail: String): Flow<List<ChatMessageEntity>> = dao.observeByUser(userEmail)
    suspend fun add(item: ChatMessageEntity) = dao.insert(item)
    suspend fun clear(userEmail: String) = dao.clearByUser(userEmail)
}
