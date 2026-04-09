package com.campusai.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.campusai.app.data.local.dao.ChatDao
import com.campusai.app.data.local.dao.CourseDao
import com.campusai.app.data.local.dao.TodoDao
import com.campusai.app.data.local.dao.UserDao
import com.campusai.app.data.local.entity.ChatMessageEntity
import com.campusai.app.data.local.entity.CourseEntity
import com.campusai.app.data.local.entity.TodoEntity
import com.campusai.app.data.local.entity.UserEntity

@Database(
    entities = [UserEntity::class, CourseEntity::class, TodoEntity::class, ChatMessageEntity::class],
    version = 1,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun courseDao(): CourseDao
    abstract fun todoDao(): TodoDao
    abstract fun chatDao(): ChatDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun get(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "campus_ai.db"
                ).build().also { INSTANCE = it }
            }
        }
    }
}
