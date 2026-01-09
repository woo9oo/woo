import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  
  // Check if key is missing or is still the default placeholder
  if (!apiKey || apiKey.includes('YOUR_API_KEY') || apiKey.includes('여기에_키를')) {
    throw new Error("API Key is missing or invalid");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes legal text and returns 8 visual scene descriptions.
 */
export const analyzeLegalText = async (text: string): Promise<string[]> => {
  const ai = getAiClient();
  
  const prompt = `
    당신은 전문 법률 콘텐츠 시각화 감독입니다.
    아래 입력된 법률 텍스트를 분석하여, 그 내용을 가장 잘 표현하는 8개의 시각적 장면(Scene)을 기획해주세요.
    
    [입력 텍스트]:
    ${text}

    [요구사항]:
    1. 총 8개의 장면을 한국어로 묘사하십시오.
    2. 각 장면은 "사진 촬영을 위한 지시문" 형태로 구체적이어야 합니다.
    3. 스타일: 진지함, 다큐멘터리, 실사(Photorealistic), 드라마틱한 조명.
    4. 배경 및 인물: 현대 한국의 법정, 사무실, 거리 풍경, 한국인 인물.
    5. 주의: 이미지 내에 텍스트(글자)가 절대 포함되지 않도록 묘사하세요. 상황과 감정, 행동 위주로 묘사합니다.
    
    [출력 포맷]:
    JSON 배열 형태로 문자열 8개를 반환하십시오.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "8 visual scene descriptions for image generation"
            }
          },
          required: ["scenes"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    if (result.scenes && Array.isArray(result.scenes) && result.scenes.length > 0) {
      // Ensure we have exactly 8, duplicate or slice if necessary
      let scenes = result.scenes;
      while (scenes.length < 8) {
        scenes.push(scenes[scenes.length % scenes.length]);
      }
      return scenes.slice(0, 8);
    }
    throw new Error("Invalid response format from analysis model");
  } catch (error) {
    console.error("Text analysis failed:", error);
    throw error;
  }
};

/**
 * Generates a single image based on a prompt using Nano Banana (Flash Image).
 * Accepts an optional tonePrompt to control style/context.
 */
export const generateSingleImage = async (sceneDescription: string, tonePrompt: string): Promise<string> => {
  const ai = getAiClient();
  
  // Combine the specific scene description with the global tone/style settings
  const finalPrompt = `
    ${tonePrompt}
    
    [Target Scene Description]:
    ${sceneDescription}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Mapped from "Nano Banana"
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    // Extract base64 image from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};