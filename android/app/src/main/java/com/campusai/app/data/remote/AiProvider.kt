package com.campusai.app.data.remote

data class AiProviderConfig(
    val baseUrl: String,
    val model: String,
    val apiKey: String,
    val providerName: String = "Custom"
)

data class ChatTurn(val role: String, val content: String)

interface AiProvider {
    suspend fun chat(prompt: String, history: List<ChatTurn>, config: AiProviderConfig): String
}
