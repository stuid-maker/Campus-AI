package com.campusai.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.campusai.app.AppContainer
import com.campusai.app.AppContextHolder
import com.campusai.app.data.local.entity.ChatMessageEntity
import com.campusai.app.data.local.entity.CourseEntity
import com.campusai.app.data.local.entity.TodoEntity
import com.campusai.app.data.remote.AiProviderConfig
import kotlinx.coroutines.launch

@Composable
fun CampusAiRootApp() {
    val scope = rememberCoroutineScope()
    val container = remember { AppContainer(AppContextHolder.appContext) }
    val currentUser by container.authRepository.currentUserEmail.collectAsState(initial = null)
    var isLogin by remember { mutableStateOf(true) }

    if (currentUser == null) {
        AuthScreen(
            isLogin = isLogin,
            onToggle = { isLogin = !isLogin },
            onSubmit = { email, password ->
                scope.launch {
                    if (isLogin) {
                        container.authRepository.login(email, password)
                    } else {
                        container.authRepository.register(email, password)
                    }
                }
            }
        )
        return
    }

    HomeScreen(
        container = container,
        userEmail = currentUser!!,
        onLogout = { scope.launch { container.authRepository.logout() } }
    )
}

@Composable
private fun AuthScreen(
    isLogin: Boolean,
    onToggle: () -> Unit,
    onSubmit: (String, String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(if (isLogin) "登录 Campus AI" else "注册 Campus AI", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("邮箱") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("密码(至少6位)") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(12.dp))
        Button(onClick = { onSubmit(email, password) }, modifier = Modifier.fillMaxWidth()) {
            Text(if (isLogin) "登录" else "注册")
        }
        TextButton(onClick = onToggle, modifier = Modifier.fillMaxWidth()) {
            Text(if (isLogin) "没有账号？去注册" else "已有账号？去登录")
        }
    }
}

@Composable
private fun HomeScreen(container: AppContainer, userEmail: String, onLogout: () -> Unit) {
    var tabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("课表", "待办", "聊天", "设置")
    Scaffold(topBar = { Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text("Campus AI", style = MaterialTheme.typography.titleLarge)
        TextButton(onClick = onLogout) { Text("退出") }
    } }) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(selectedTabIndex = tabIndex) {
                tabs.forEachIndexed { i, label ->
                    Tab(selected = tabIndex == i, onClick = { tabIndex = i }, text = { Text(label) })
                }
            }
            when (tabIndex) {
                0 -> ScheduleScreen(container, userEmail)
                1 -> TodoScreen(container, userEmail)
                2 -> ChatScreen(container, userEmail)
                else -> SettingsScreen(container)
            }
        }
    }
}

@Composable
private fun ScheduleScreen(container: AppContainer, userEmail: String) {
    val courses by container.courseRepository.observe(userEmail).collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        item {
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("课程名") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = location, onValueChange = { location = it }, label = { Text("地点") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(onClick = {
                scope.launch {
                    if (name.isNotBlank()) {
                        container.courseRepository.add(CourseEntity(userEmail = userEmail, name = name, location = location, dayOfWeek = 1, startTime = "08:00", endTime = "09:35", weeksCsv = "1-16", color = "#3b82f6"))
                        name = ""
                        location = ""
                    }
                }
            }) { Text("新增课程") }
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
        }
        items(courses) { c ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("${c.name} ${c.startTime}-${c.endTime}")
                TextButton(onClick = { scope.launch { container.courseRepository.remove(c) } }) { Text("删除") }
            }
        }
    }
}

@Composable
private fun TodoScreen(container: AppContainer, userEmail: String) {
    val todos by container.todoRepository.observe(userEmail).collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var title by remember { mutableStateOf("") }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        item {
            OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("待办标题") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(onClick = {
                scope.launch {
                    if (title.isNotBlank()) {
                        container.todoRepository.add(TodoEntity(userEmail = userEmail, title = title))
                        title = ""
                    }
                }
            }) { Text("新增待办") }
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
        }
        items(todos) { t ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(if (t.completed) "已完成: ${t.title}" else t.title)
                Row {
                    TextButton(onClick = { scope.launch { container.todoRepository.update(t.copy(completed = !t.completed)) } }) { Text("切换") }
                    TextButton(onClick = { scope.launch { container.todoRepository.remove(t) } }) { Text("删除") }
                }
            }
        }
    }
}

@Composable
private fun ChatScreen(container: AppContainer, userEmail: String) {
    val messages by container.chatRepository.observe(userEmail).collectAsState(initial = emptyList())
    val settings by container.appSettingsStore.settings.collectAsState(
        initial = com.campusai.app.core.settings.AppSettings()
    )
    val scope = rememberCoroutineScope()
    var input by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(messages) { msg ->
                Text("${msg.role}: ${msg.content}")
                Spacer(Modifier.height(6.dp))
            }
        }
        if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
        OutlinedTextField(value = input, onValueChange = { input = it }, label = { Text("输入问题") }, modifier = Modifier.fillMaxWidth())
        Row {
            Button(onClick = {
                val text = input.trim()
                if (text.isEmpty()) return@Button
                input = ""
                scope.launch {
                    runCatching {
                        container.chatRepository.add(ChatMessageEntity(userEmail = userEmail, role = "user", content = text))
                        val historyTurns = messages.map { com.campusai.app.data.remote.ChatTurn(role = it.role, content = it.content) }
                        val reply = container.aiProvider.chat(
                            prompt = text,
                            history = historyTurns,
                            config = AiProviderConfig(
                                baseUrl = settings.baseUrl,
                                model = settings.model,
                                apiKey = container.secureSettingsStore.readApiKey()
                            )
                        )
                        container.chatRepository.add(ChatMessageEntity(userEmail = userEmail, role = "assistant", content = reply))
                    }.onFailure { error = it.message ?: "调用模型失败" }
                }
            }) { Text("发送") }
            Spacer(Modifier.height(0.dp).weight(1f))
            TextButton(onClick = { scope.launch { container.chatRepository.clear(userEmail) } }) { Text("清空") }
        }
    }
}

@Composable
private fun SettingsScreen(container: AppContainer) {
    val scope = rememberCoroutineScope()
    val settings by container.appSettingsStore.settings.collectAsState(initial = com.campusai.app.core.settings.AppSettings())
    var aiName by remember(settings.aiName) { mutableStateOf(settings.aiName) }
    var personality by remember(settings.aiPersonality) { mutableStateOf(settings.aiPersonality) }
    var baseUrl by remember(settings.baseUrl) { mutableStateOf(settings.baseUrl) }
    var model by remember(settings.model) { mutableStateOf(settings.model) }
    var apiKey by remember { mutableStateOf(container.secureSettingsStore.readApiKey()) }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        item {
            OutlinedTextField(value = aiName, onValueChange = { aiName = it }, label = { Text("AI名称") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = personality, onValueChange = { personality = it }, label = { Text("AI人设") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = baseUrl, onValueChange = { baseUrl = it }, label = { Text("Base URL") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = model, onValueChange = { model = it }, label = { Text("模型名") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = apiKey, onValueChange = { apiKey = it }, label = { Text("API Key") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(onClick = {
                scope.launch {
                    container.appSettingsStore.save(
                        com.campusai.app.core.settings.AppSettings(
                            aiName = aiName,
                            aiPersonality = personality,
                            baseUrl = baseUrl,
                            model = model
                        )
                    )
                    container.secureSettingsStore.saveApiKey(apiKey)
                }
            }) { Text("保存设置") }
        }
    }
}
