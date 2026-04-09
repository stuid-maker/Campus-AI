import React, { useState, useEffect, useRef } from 'react';
import { db, type LocalUser, type LocalCourse, type LocalTodo, type LocalChatMessage } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { askAI } from './services/aiService';
import { extractTextFromImage, parseScheduleFromText } from './gemini';
import { cn, getDayName } from './utils';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Plus, 
  MessageSquare, 
  Camera, 
  LogOut, 
  User as UserIcon,
  Clock,
  MapPin,
  Trash2,
  Send,
  Loader2,
  ChevronRight,
  X,
  Download,
  ExternalLink,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Globe,
  Key,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { differenceInWeeks, startOfWeek, parseISO, format } from 'date-fns';

export default function App() {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'todo' | 'chat' | 'settings'>('schedule');

  // Sync Data from Local DB
  const courses = useLiveQuery(() => db.courses.where('userId').equals(currentUser?.id || -1).toArray(), [currentUser]);
  const todos = useLiveQuery(() => db.todos.where('userId').equals(currentUser?.id || -1).toArray(), [currentUser]);
  const chatHistory = useLiveQuery(async () => {
    const history = await db.chatHistory.where('userId').equals(currentUser?.id || -1).toArray();
    return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [currentUser]);
  
  useEffect(() => {
    const checkSession = async () => {
      const savedUserId = localStorage.getItem('campus_user_id');
      if (savedUserId) {
        const user = await db.users.get(Number(savedUserId));
        if (user) setCurrentUser(user);
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoginLoading(true);
    setLoginError(null);

    try {
      if (authMode === 'register') {
        const existing = await db.users.get({ username });
        if (existing) throw new Error("用户名已存在");
        
        const id = await db.users.add({
          username,
          passwordHash: password,
          aiName: '小智',
          aiPersonality: '温柔体贴的校园助手',
          aiProvider: 'gemini',
          aiApiKey: '',
          aiApiUrl: '',
          aiModel: 'gemini-1.5-flash',
          semesterStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        });
        const newUser = await db.users.get(id);
        if (newUser) {
          setCurrentUser(newUser);
          localStorage.setItem('campus_user_id', String(id));
        }
      } else {
        const user = await db.users.get({ username, passwordHash: password });
        if (!user) throw new Error("用户名或密码错误");
        setCurrentUser(user);
        localStorage.setItem('campus_user_id', String(user.id));
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('campus_user_id');
  };

  const handleNewChat = async () => {
    if (!currentUser?.id) return;
    await db.chatHistory.where('userId').equals(currentUser.id).delete();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView 
        authMode={authMode}
        setAuthMode={setAuthMode}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        onAuth={handleAuth}
        loading={loginLoading}
        error={loginError}
      />
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden ring-1 ring-slate-200">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md px-6 py-4 border-b flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 cursor-pointer overflow-hidden"
          >
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">{currentUser.aiName || 'AI 校园助手'}</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">BIT Campus Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {activeTab === 'chat' && (
            <button 
              onClick={handleNewChat}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              title="新对话"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'schedule' && (
            <div className="h-full overflow-y-auto p-5 pb-28">
              <ScheduleView key="schedule" courses={courses || []} userProfile={currentUser} />
            </div>
          )}
          {activeTab === 'todo' && (
            <div className="h-full overflow-y-auto p-5 pb-28">
              <TodoView key="todo" todos={todos || []} userId={currentUser.id!} />
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="h-full p-5 pb-28">
              <ChatView key="chat" history={chatHistory || []} userId={currentUser.id!} userProfile={currentUser} />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="h-full overflow-y-auto p-5 pb-28">
              <SettingsView key="settings" userProfile={currentUser} onUpdate={setCurrentUser} />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="glass-nav px-8 py-4 flex justify-between items-center fixed bottom-0 left-0 right-0 max-w-md mx-auto z-20 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <NavButton 
          active={activeTab === 'schedule'} 
          onClick={() => setActiveTab('schedule')} 
          icon={<Calendar className="w-6 h-6" />} 
          label="课表" 
        />
        <NavButton 
          active={activeTab === 'todo'} 
          onClick={() => setActiveTab('todo')} 
          icon={<CheckCircle2 className="w-6 h-6" />} 
          label="待办" 
        />
        <NavButton 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')} 
          icon={<MessageSquare className="w-6 h-6" />} 
          label={currentUser.aiName || "AI助手"} 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<Settings className="w-6 h-6" />} 
          label="设置" 
        />
      </nav>
    </div>
  );
}

// --- Settings View ---
function SettingsView({ userProfile, onUpdate }: { userProfile: LocalUser, onUpdate: (user: LocalUser) => void }) {
  const [startDate, setStartDate] = useState(userProfile.semesterStartDate || format(new Date(), 'yyyy-MM-dd'));
  const [aiName, setAiName] = useState(userProfile.aiName || 'AI 校园助手');
  const [aiPersonality, setAiPersonality] = useState(userProfile.aiPersonality || '亲切、准确且有条理');
  const [aiAvatar, setAiAvatar] = useState(userProfile.photoURL || '');
  const [aiProvider, setAiProvider] = useState(userProfile.aiProvider || 'gemini');
  const [aiApiKey, setAiApiKey] = useState(userProfile.aiApiKey || '');
  const [aiApiUrl, setAiApiUrl] = useState(userProfile.aiApiUrl || '');
  const [aiModel, setAiModel] = useState(userProfile.aiModel || 'gemini-1.5-flash');
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!userProfile.id) return;
    setLoading(true);
    try {
      const updatedUser: LocalUser = {
        ...userProfile,
        semesterStartDate: startDate,
        aiName,
        aiPersonality,
        photoURL: aiAvatar,
        aiProvider,
        aiApiKey,
        aiApiUrl,
        aiModel
      };
      await db.users.update(userProfile.id, updatedUser);
      onUpdate(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAiAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col space-y-8 pb-10"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">系统设置</h2>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> 已保存
          </motion.div>
        )}
      </div>

      <div className="space-y-6">
        {/* AI Avatar Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">AI 形象设置</h3>
          <div className="flex items-center gap-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors"
            >
              {aiAvatar ? (
                <img src={aiAvatar} alt="AI Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-slate-400" />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-[10px] text-white font-bold">更换图片</p>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-700">自定义 AI 图标</p>
              <p className="text-xs text-slate-400 mt-1">上传一张照片，作为主页和聊天中 AI 的专属头像。</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
          </div>
        </section>

        {/* AI Persona Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">AI 助手设定</h3>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">助手名称</label>
            <input 
              placeholder="例如：小北" 
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={aiName}
              onChange={e => setAiName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">性格描述</label>
            <textarea 
              placeholder="例如：幽默风趣、严谨认真" 
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold h-24 resize-none"
              value={aiPersonality}
              onChange={e => setAiPersonality(e.target.value)}
            />
          </div>
        </section>

        {/* AI API Configuration */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">AI 接口配置 (免 VPN 关键)</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setAiProvider('gemini')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-xs transition-all ${aiProvider === 'gemini' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
            >
              <Sparkles className="w-4 h-4" /> Gemini
            </button>
            <button 
              onClick={() => setAiProvider('custom')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-xs transition-all ${aiProvider === 'custom' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
            >
              <Globe className="w-4 h-4" /> 自定义/国内
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Key className="w-3 h-3" /> API Key
              </label>
              <input 
                type="password"
                placeholder="输入您的 API Key" 
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                value={aiApiKey}
                onChange={e => setAiApiKey(e.target.value)}
              />
            </div>
            {aiProvider === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> API 地址 (Endpoint)
                </label>
                <input 
                  placeholder="例如：https://api.deepseek.com/v1/chat/completions" 
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  value={aiApiUrl}
                  onChange={e => setAiApiUrl(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> 模型名称 (Model)
              </label>
              <input 
                placeholder="例如：deepseek-chat 或 gemini-1.5-flash" 
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            提示：如果您在国内，建议使用自定义提供商并填入国内大模型（如 DeepSeek、通义千问）的 API 信息。
          </p>
        </section>

        {/* Semester Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">学期设置</h3>
          <label className="block text-xs font-bold text-slate-500 mb-2">学期开始日期 (第一周周一)</label>
          <input 
            type="date" 
            className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </section>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          保存所有修改
        </button>
      </div>
    </motion.div>
  );
}

function LoginView({ 
  authMode,
  setAuthMode,
  username,
  setUsername,
  password,
  setPassword,
  onAuth,
  loading, 
  error
}: { 
  authMode: 'login' | 'register',
  setAuthMode: (mode: 'login' | 'register') => void,
  username: string,
  setUsername: (val: string) => void,
  password: string,
  setPassword: (val: string) => void,
  onAuth: (e: React.FormEvent) => void,
  loading: boolean, 
  error: string | null
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold mb-8 shadow-lg shadow-blue-200"
      >
        AI
      </motion.div>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">AI 校园助手</h1>
      <p className="text-slate-500 mb-8 max-w-xs">
        智能管理你的校园生活：课表、待办、AI问答，一站式解决。
      </p>

      <div className="w-full max-w-xs space-y-4">
        <form onSubmit={onAuth} className="space-y-3">
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="用户名"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="password"
              placeholder="密码"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 p-3 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-100 text-left"
            >
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </p>
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? '立即登录' : '注册账号')}
          </button>
        </form>

        <div className="flex items-center justify-center px-1">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            {authMode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 mt-8">
          数据将安全存储在您的设备本地，无需 VPN 即可使用
        </p>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-blue-600 scale-110" : "text-slate-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// --- Schedule View ---
function ScheduleView({ courses, userProfile }: { courses: LocalCourse[], userProfile: LocalUser }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  const today = new Date().getDay();
  
  // Calculate current week
  const getWeekNumber = (startDateStr: string) => {
    try {
      const start = startOfWeek(parseISO(startDateStr), { weekStartsOn: 1 });
      const now = new Date();
      const diff = differenceInWeeks(now, start);
      return Math.max(1, diff + 1);
    } catch (e) {
      return 1;
    }
  };

  const currentWeek = userProfile.semesterStartDate ? getWeekNumber(userProfile.semesterStartDate) : 1;

  const filteredCourses = courses.filter(c => {
    if (!c.weeks || c.weeks.length === 0) return true;
    return c.weeks.includes(currentWeek);
  });
  
  const todayCourses = filteredCourses.filter(c => c.dayOfWeek === today);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">今日课程</h2>
            <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black flex items-center gap-1">
              第 {currentWeek} 周
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium">{getDayName(today)} · {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImport(true)}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all"
            title="从教务系统导入"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {todayCourses.length > 0 ? (
          todayCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <div className="bento-card p-10 text-center border-dashed border-slate-200">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">今天没有课，休息一下吧！</p>
          </div>
        )}
      </div>

      {filteredCourses.length > todayCourses.length && (
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-slate-100" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">本周其他课程</h3>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {filteredCourses.filter(c => c.dayOfWeek !== today).map(course => (
              <div key={course.id} className="bento-card p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: course.color || '#3b82f6' }} />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{course.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-0.5">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{getDayName(course.dayOfWeek)}</span>
                      <span>{course.startTime} - {course.endTime}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => db.courses.delete(course.id!)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddCourseModal onClose={() => setShowAdd(false)} userId={userProfile.id!} />}
      {showImport && <ImportScheduleModal onClose={() => setShowImport(false)} userId={userProfile.id!} />}
    </motion.div>
  );
}

function CourseCard({ course }: { course: LocalCourse }) {
  const weeksDisplay = () => {
    if (!course.weeks || course.weeks.length === 0) return '全周';
    const ranges: string[] = [];
    let start = course.weeks[0];
    let prev = course.weeks[0];
    for (let i = 1; i <= course.weeks.length; i++) {
      const curr = course.weeks[i];
      if (curr !== prev + 1 || i === course.weeks.length) {
        if (start === prev) ranges.push(`${start}`);
        else ranges.push(`${start}-${prev}`);
        start = curr;
      }
      prev = curr;
    }
    return ranges.join(',') + '周';
  };

  return (
    <div className="bento-card p-5 flex items-start gap-5 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: course.color || '#3b82f6' }} />
      <div className="flex flex-col items-center justify-center min-w-[50px] py-1">
        <span className="text-xs font-black text-slate-900">{course.startTime}</span>
        <div className="w-px h-6 bg-slate-100 my-1" />
        <span className="text-[10px] font-bold text-slate-400">{course.endTime}</span>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{course.name}</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold bg-slate-50 px-2 py-1 rounded-lg">
            <MapPin className="w-3 h-3 text-blue-500" />
            <span>{course.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold bg-slate-50 px-2 py-1 rounded-lg">
            <Calendar className="w-3 h-3 text-indigo-500" />
            <span>{weeksDisplay()}</span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => db.courses.delete(course.id!)}
        className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function ImportScheduleModal({ onClose, userId }: { onClose: () => void, userId: number }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleImport = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const parsedCourses = await parseScheduleFromText(text);
      if (Array.isArray(parsedCourses)) {
        if (overwrite) {
          await db.courses.where('userId').equals(userId).delete();
        }
        for (const course of parsedCourses) {
          await db.courses.add({
            ...course,
            userId,
            color: course.color || `#${Math.floor(Math.random()*16777215).toString(16)}`
          });
        }
        setStatus({ type: 'success', msg: `成功导入 ${parsedCourses.length} 门课程！` });
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: '解析失败，请确保复制了完整的课程表内容。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900">教务系统导入</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              请登录 BIT教务系统，进入“我的课表”，全选并复制页面内容，然后粘贴到下方。
            </p>
          </div>
          <textarea 
            placeholder="在此粘贴课程表文本内容..." 
            className="w-full h-48 px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={overwrite}
              onChange={e => setOverwrite(e.target.checked)}
            />
            <span className="text-sm font-bold text-slate-700">覆盖原有课表 (导入前清空旧数据)</span>
          </label>
          {status && (
            <div className={cn(
              "p-3 rounded-xl text-xs font-bold text-center",
              status.type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            )}>
              {status.msg}
            </div>
          )}
          <button 
            onClick={handleImport}
            disabled={loading || !text.trim()}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? '正在智能解析...' : '一键智能导入'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AddCourseModal({ onClose, userId }: { onClose: () => void, userId: number }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [day, setDay] = useState(1);
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('09:35');
  const [color, setColor] = useState('#3b82f6');
  const [weeksStr, setWeeksStr] = useState('1-16');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weeks: number[] = [];
    weeksStr.split(',').forEach(part => {
      const range = part.trim().split('-');
      if (range.length === 2) {
        for (let i = parseInt(range[0]); i <= parseInt(range[1]); i++) weeks.push(i);
      } else if (range.length === 1 && range[0]) {
        weeks.push(parseInt(range[0]));
      }
    });

    await db.courses.add({
      userId,
      name,
      location,
      dayOfWeek: Number(day),
      startTime: start,
      endTime: end,
      weeks: weeks.length > 0 ? weeks : Array.from({length: 16}, (_, i) => i + 1),
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900">添加课程</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            placeholder="课程名称" 
            className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            value={name} onChange={e => setName(e.target.value)} required
          />
          <input 
            placeholder="上课地点" 
            className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            value={location} onChange={e => setLocation(e.target.value)} required
          />
          <div className="grid grid-cols-2 gap-4">
            <select 
              className="px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={day} onChange={e => setDay(Number(e.target.value))}
            >
              {[1,2,3,4,5,6,0].map(d => <option key={d} value={d}>{getDayName(d)}</option>)}
            </select>
            <input 
              placeholder="上课周次 (如 1-16)" 
              className="px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={weeksStr} onChange={e => setWeeksStr(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
              <span className="text-xs font-bold text-slate-400">颜色</span>
              <input type="color" className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="time" className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border-none text-xs font-bold" value={start} onChange={e => setStart(e.target.value)} required />
              <input type="time" className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border-none text-xs font-bold" value={end} onChange={e => setEnd(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">保存课程</button>
        </form>
      </motion.div>
    </div>
  );
}

// --- Todo View ---
function TodoView({ todos, userId }: { todos: LocalTodo[], userId: number }) {
  const [newTodo, setNewTodo] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await db.todos.add({
      userId,
      title: newTodo,
      completed: false,
      createdAt: new Date().toISOString()
    });
    setNewTodo('');
  };

  const toggleTodo = async (todo: LocalTodo) => {
    await db.todos.update(todo.id!, {
      completed: !todo.completed
    });
  };

  const deleteTodo = async (id: number) => {
    await db.todos.delete(id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">待办清单</h2>

      <form onSubmit={handleAdd} className="relative group">
        <input 
          placeholder="添加新任务..." 
          className="w-full px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none pr-16 transition-all"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
        />
        <button type="submit" className="absolute right-2 top-2 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-all">
          <Plus className="w-6 h-6" />
        </button>
      </form>

      <div className="space-y-3">
        {todos.map(todo => (
          <div key={todo.id} className="bento-card p-4 flex items-center gap-4 group">
            <button onClick={() => toggleTodo(todo)} className="transition-transform active:scale-90">
              {todo.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-slate-200" />
              )}
            </button>
            <span className={cn("flex-1 font-bold text-sm", todo.completed ? "text-slate-300 line-through" : "text-slate-700")}>
              {todo.title}
            </span>
            <button 
              onClick={() => deleteTodo(todo.id!)}
              className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// --- Chat View ---
function ChatView({ history, userId, userProfile }: { history: LocalChatMessage[], userId: number, userProfile: LocalUser }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isTyping]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input;
    setInput('');
    setIsTyping(true);

    try {
      // Save user message
      await db.chatHistory.add({
        userId,
        role: 'user',
        content: userMsg,
        timestamp: new Date().toISOString()
      });

      // Prepare history for AI
      const aiHistory = history.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const response = await askAI(
        userMsg, 
        aiHistory, 
        {
          provider: userProfile.aiProvider as any || 'gemini',
          apiKey: userProfile.aiApiKey || '',
          apiUrl: userProfile.aiApiUrl || '',
          model: userProfile.aiModel || '',
          aiName: userProfile.aiName || 'AI助手',
          aiPersonality: userProfile.aiPersonality || ''
        }
      );

      // Save AI message
      await db.chatHistory.add({
        userId,
        role: 'model',
        content: response,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        // Fallback to gemini for OCR if no custom config, or we can implement custom OCR
        const extractedText = await extractTextFromImage(base64, userProfile.aiName || 'AI助手', userProfile.aiPersonality || '');
        setInput(prev => prev + (prev ? '\n' : '') + extractedText);
      } catch (err) {
        console.error(err);
      } finally {
        setIsOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col"
    >
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto mb-4 pr-2 scroll-smooth relative"
      >
        {history.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-medium">有什么我可以帮你的吗？<br/>你可以问我课程安排或学习问题。</p>
          </div>
        )}
        {history.map(msg => (
          <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm font-medium",
              msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border text-slate-700 rounded-tl-none"
            )}>
              <div className="prose prose-sm max-w-none prose-slate dark:prose-invert">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-8 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-600 z-10 hover:bg-slate-50"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isOcrLoading}
            className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
          >
            {isOcrLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          </button>
          <div className="flex-1 relative">
            <textarea 
              placeholder="输入你的问题..." 
              className="w-full px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none pr-14 resize-none max-h-32 font-medium"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
