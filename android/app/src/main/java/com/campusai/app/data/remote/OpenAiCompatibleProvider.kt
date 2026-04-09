package com.campusai.app.data.remote

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

class OpenAiCompatibleProvider : AiProvider {
    override suspend fun chat(prompt: String, history: List<ChatTurn>, config: AiProviderConfig): String {
        val api = createApi(config.baseUrl)
        val messages = history.map { ChatMessageDto(it.role, it.content) } + ChatMessageDto("user", prompt)
        val response = api.chatCompletions(
            authorization = "Bearer ${config.apiKey}",
            request = ChatRequestDto(model = config.model, messages = messages)
        )
        return response.choices.firstOrNull()?.message?.content ?: "模型未返回内容。"
    }

    private fun createApi(baseUrl: String): OpenAiApi {
        val logger = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.NONE }
        val client = OkHttpClient.Builder().addInterceptor(logger).build()
        return Retrofit.Builder()
            .baseUrl(baseUrl.ensureTrailingSlash())
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
            .create(OpenAiApi::class.java)
    }
}

private interface OpenAiApi {
    @POST("v1/chat/completions")
    suspend fun chatCompletions(
        @Header("Authorization") authorization: String,
        @Body request: ChatRequestDto
    ): ChatResponseDto
}

private data class ChatRequestDto(
    val model: String,
    val messages: List<ChatMessageDto>
)

private data class ChatMessageDto(
    val role: String,
    val content: String
)

private data class ChatResponseDto(
    val choices: List<ChoiceDto>
)

private data class ChoiceDto(
    val message: ChatMessageDto
)

private fun String.ensureTrailingSlash(): String = if (endsWith("/")) this else "$this/"
