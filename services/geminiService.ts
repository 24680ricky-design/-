import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// We access process.env.API_KEY. In the browser, we rely on the shim in index.html 
// or the build tool replacing this.
// Using explicit optional chaining for safety just in case.

const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

export const generateHint = async (name: string): Promise<string> => {
  if (!apiKey) {
    console.warn("No API Key available for Gemini. Please set process.env.API_KEY.");
    // Return a default hint instead of crashing
    return "請仔細觀察這位同學的特徵";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      角色：特教輔助科技專家。
      任務：針對識字困難或認知障礙的學生，用「繁體中文」產生一個簡短的視覺特徵提示。
      目標：幫助學生辨識這個名字的人。
      限制：15個字以內。簡單直白。
      
      名字：${name}
      
      請直接回傳提示句子，不要有其他廢話。如果是常見物品名，請描述外觀；如果是人名，請想像一個溫暖的特徵描述（例如：愛笑的、戴眼鏡的）。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "請觀察這張照片";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "請仔細看照片特徵";
  }
};