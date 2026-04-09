import Dexie, { type Table } from 'dexie';

export interface LocalUser {
  id?: number;
  username: string;
  passwordHash: string; // 简单演示，实际建议加密
  aiName: string;
  aiPersonality: string;
  aiProvider: 'gemini' | 'custom';
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;
  photoURL?: string;
  semesterStartDate?: string;
}

export interface LocalCourse {
  id?: number;
  userId: number;
  name: string;
  location: string;
  teacher?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  weeks: number[];
  color: string;
}

export interface LocalTodo {
  id?: number;
  userId: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface LocalChatMessage {
  id?: number;
  userId: number;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export class CampusDb extends Dexie {
  users!: Table<LocalUser>;
  courses!: Table<LocalCourse>;
  todos!: Table<LocalTodo>;
  chatHistory!: Table<LocalChatMessage>;

  constructor() {
    super('CampusAssistantDB');
    this.version(1).stores({
      users: '++id, &username',
      courses: '++id, userId, dayOfWeek',
      todos: '++id, userId, completed',
      chatHistory: '++id, userId, timestamp'
    });
  }
}

export const db = new CampusDb();
