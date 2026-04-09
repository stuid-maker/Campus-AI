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
  
  // 如果是 Gemini 且有 Key，尝试直接调用（可能需要 VPN）
  // 如果是 Custom，调用用户定义的 API（可配合国内中转或国内模型）
  const endpoint = config.provider === 'gemini' 
    ? `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey}`
    : config.apiUrl;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content })),
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.provider === 'custom' && { 'Authorization': `Bearer ${config.apiKey}` })
      },
      body: JSON.stringify(
        config.provider === 'gemini' 
          ? {
              contents: history.concat({ role: 'user', content: prompt }).map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
              })),
              system_instruction: { parts: [{ text: systemPrompt }] }
            }
          : {
              model: config.model,
              messages: messages,
              stream: false
            }
      )
    });

    const data = await response.json();
    
    if (config.provider === 'gemini') {
      return data.candidates[0].content.parts[0].text;
    } else {
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error("AI Call Failed:", error);
    throw new Error("AI 响应失败，请检查网络或 API 配置。");
  }
}
