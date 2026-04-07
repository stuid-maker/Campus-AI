import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiModel = "gemini-3-flash-preview";

export async function askGemini(prompt: string, history: { role: "user" | "model", parts: { text: string }[] }[] = [], aiName: string = 'AI 校园助手', aiPersonality: string = '亲切、准确且有条理') {
  try {
    const chat = ai.chats.create({
      model: geminiModel,
      history: history,
      config: {
        systemInstruction: `你是一个专业的校园助手。你的名字是“${aiName}”。请始终使用中文回答。你的回答应该${aiPersonality}。`,
      }
    });
    const result = await chat.sendMessage({ message: prompt });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function parseScheduleFromText(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: {
        parts: [
          { text: `你是一个北京理工大学(BIT)教务系统课程表解析专家。请从以下文本中提取课程信息。
          
          解析规则：
          1. 识别课程名称（如：Android技术开发基础）。
          2. 识别上课周次（非常重要！）：
             - 处理范围（如 "1-11周" 对应 [1,2,3,4,5,6,7,8,9,10,11]）。
             - 处理逗号分隔的范围（如 "1-2周, 4-16周" 对应 [1,2,4,5,6,7,8,9,10,11,12,13,14,15,16]）。
             - 处理单周（如 "3周" 对应 [3]）。
          3. 识别星期几（1-7，转换为 0-6，0是周日，1是周一...）。
          4. 识别节次并转换为具体时间（BIT标准时间）：
             - 第1-2节: 08:00 - 09:35
             - 第3-5节: 09:55 - 12:20
             - 第6-7节: 13:20 - 14:55
             - 第8-10节: 15:15 - 17:40
             - 第11-13节: 18:30 - 20:55
             - 注意：每小节45分钟，小节间休息5分钟。如遇其他节次组合（如3-4节），请按此规律推算。
          5. 识别上课地点（如：文萃楼F604）。
          
          返回一个 JSON 数组，每个对象包含：
          - name: string
          - location: string
          - dayOfWeek: number (0-6)
          - startTime: string (HH:mm)
          - endTime: string (HH:mm)
          - weeks: number[] (包含所有上课周次的数组)
          - color: string (随机十六进制颜色)
          
          文本内容：
          ${text}` }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
}

export async function extractTextFromImage(base64Image: string, aiName: string = 'AI 校园助手', aiPersonality: string = '亲切、准确且有条理') {
  try {
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: {
        parts: [
          { text: `你是一个专业的校园助手。你的名字是“${aiName}”。请提取这张图片中的所有文字。你的回答应该${aiPersonality}。` },
          { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
}
