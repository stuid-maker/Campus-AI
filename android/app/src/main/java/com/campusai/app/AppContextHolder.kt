package com.campusai.app

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context

class CampusAiApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        appContext = applicationContext
    }
}

@SuppressLint("StaticFieldLeak")
object AppContextHolder {
    lateinit var appContext: Context
}
