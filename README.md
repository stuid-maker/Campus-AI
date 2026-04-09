# Campus-AI

校园 AI 助手项目，目标是提供课表管理、待办管理、AI 对话等一体化体验。

当前仓库包含两部分：

- `src/`：历史 Web 版本（React + Vite）
- `android/`：新的原生 Android 版本（Kotlin + Compose，本地优先）

---

## 项目目标

- 在中国大陆网络环境可用（尽量不依赖 VPN）。
- 提供“像真实 App 一样”的安装与使用体验（非网页壳子）。
- 支持用户自定义模型服务（Base URL / API Key / Model）。
- 采用本地优先数据存储，确保核心功能离线可用。

---

## 功能概览

### 已实现（Android MVP）

- 本地账号登录/注册（邮箱 + 密码，密码哈希存储）
- 课表管理（本地 CRUD）
- 待办管理（本地 CRUD + 完成状态切换）
- 聊天记录本地持久化
- AI 服务可配置（Base URL / API Key / Model）
- API Key 加密存储（Android Keystore + EncryptedSharedPreferences）

### 规划中

- OCR 图片识别接入可配置模型
- 课程表文本智能解析
- 本地数据导入导出（备份/换机）
- 可选云同步（国内可用后端）

---

## 技术架构（Android）

- UI：Jetpack Compose
- 架构：MVVM + Repository
- 本地数据：Room (SQLite)
- 本地设置：DataStore
- 敏感信息：EncryptedSharedPreferences
- 网络：Retrofit + OkHttp（OpenAI-Compatible 接口）

核心代码目录：

- `android/app/src/main/java/com/campusai/app/ui/`
- `android/app/src/main/java/com/campusai/app/data/`
- `android/app/src/main/java/com/campusai/app/core/`

---

## 快速开始

## 1) Android 原生版本（推荐）

前置要求：

- Android Studio（建议较新稳定版）
- Android SDK（minSdk 26, targetSdk 35）
- JDK 17

启动步骤：

1. 用 Android Studio 打开 `android/`
2. 等待 Gradle 同步完成
3. 连接真机或启动模拟器
4. 点击 Run 运行

更多说明见：`android/README.md`

## 2) Web 历史版本（仅兼容维护）

前置要求：

- Node.js 18+

启动步骤：

1. 安装依赖：`npm install`
2. 配置环境变量（如需要）：`.env.local`
3. 启动开发：`npm run dev`

---

## 文档索引

- Android MVP 规格：`docs/android-mvp-spec.md`
- Android 发布检查清单：`docs/android-release-checklist.md`
- Android 子项目说明：`android/README.md`

---

## 发布与合规建议

- 发布前请完成签名配置（APK/AAB）。
- 确保隐私政策覆盖本地数据与第三方模型调用行为。
- 确保日志中不输出 API Key 或其他敏感信息。

---

## 说明

本仓库正在从 Web 形态向原生 Android 形态迁移。  
如需继续开发，建议以 `android/` 为主线推进。
