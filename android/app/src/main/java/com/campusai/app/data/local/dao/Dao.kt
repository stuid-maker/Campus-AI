package com.campusai.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.campusai.app.data.local.entity.ChatMessageEntity
import com.campusai.app.data.local.entity.CourseEntity
import com.campusai.app.data.local.entity.TodoEntity
import com.campusai.app.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun create(user: UserEntity)

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun findByEmail(email: String): UserEntity?
}

@Dao
interface CourseDao {
    @Insert
    suspend fun insert(item: CourseEntity)

    @Delete
    suspend fun delete(item: CourseEntity)

    @Query("SELECT * FROM courses WHERE userEmail = :userEmail ORDER BY dayOfWeek, startTime")
    fun observeByUser(userEmail: String): Flow<List<CourseEntity>>
}

@Dao
interface TodoDao {
    @Insert
    suspend fun insert(item: TodoEntity)

    @Update
    suspend fun update(item: TodoEntity)

    @Delete
    suspend fun delete(item: TodoEntity)

    @Query("SELECT * FROM todos WHERE userEmail = :userEmail ORDER BY createdAtEpochMs DESC")
    fun observeByUser(userEmail: String): Flow<List<TodoEntity>>
}

@Dao
interface ChatDao {
    @Insert
    suspend fun insert(item: ChatMessageEntity)

    @Query("SELECT * FROM chat_messages WHERE userEmail = :userEmail ORDER BY createdAtEpochMs ASC")
    fun observeByUser(userEmail: String): Flow<List<ChatMessageEntity>>

    @Query("DELETE FROM chat_messages WHERE userEmail = :userEmail")
    suspend fun clearByUser(userEmail: String)
}
