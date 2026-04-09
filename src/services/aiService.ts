import { GoogleGenAI } from "@google/genai";

export async function askAI(
  prompt: string, 
  history: { role: string, content: string }[],
  config: {
    provider: 'gemini' | 'custom',
    apiKey: string,
    apiUrl: string,
    model: string,
    aiName: string,
    aiPersonality: string
  }
) {
  const systemPrompt = `你是${config.aiName}。你的性格特点是：${config.aiPersonality}。请以此身份回答用户。`;
  let modelName = config.model || 'gemini-3-flash-preview';
  
  // 强制纠正已弃用的模型名
  if (modelName.includes('gemini-1.5')) {
    modelName = 'gemini-3-flash-preview';
  }

  const effectiveApiKey = config.apiKey || (config.provider === 'gemini' ? process.env.GEMINI_API_KEY : '');

  if (config.provider === 'gemini') {
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey || '' });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: history.concat({ role: 'user', content: prompt }).map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: systemPrompt
        }
      });

      if (!response.text) {
        throw new Error("Gemini 未返回任何结果。");
      }
      return response.text;
    } catch (error: any) {
      console.error("Gemini SDK Call Failed:", error);
      
      // 如果报错是 404 (NOT_FOUND)，尝试使用通用模型名回退
      if (error?.message?.includes('404') || error?.message?.includes('NOT_FOUND')) {
        try {
          console.log("Attempting fallback to gemini-2.0-flash...");
          const ai = new GoogleGenAI({ apiKey: effectiveApiKey || '' });
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: history.concat({ role: 'user', content: prompt }).map(m => ({
              role: m.role === 'model' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            config: {
              systemInstruction: systemPrompt
            }
          });
          if (fallbackResponse.text) return fallbackResponse.text;
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      }

      if (error instanceof Error) throw error;
      throw new Error("Gemini 响应失败，请检查 API 配置。");
    }
  }

  // Custom Provider logic using fetch
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content })),
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        stream: false
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Custom AI API Error Response:", data);
      throw new Error(data.error?.message || data.message || `API 请求失败 (状态码: ${response.status})`);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error("AI 未返回任何结果。");
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Custom AI Call Failed:", error);
    if (error instanceof Error) throw error;
    throw new Error("AI 响应失败，请检查网络或 API 配置。");
  }
}
