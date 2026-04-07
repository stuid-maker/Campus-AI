export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  semesterStartDate?: string; // YYYY-MM-DD
  aiName?: string;
  aiPersonality?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  userId: string;
  name: string;
  location: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  weeks: number[];
  color: string;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}
