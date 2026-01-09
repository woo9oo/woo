import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * 법률 텍스트를 분석하여 8개의 시각적 장면 묘사를 생성합니다.
 */
export const analyzeLegalText = async (text: string): Promise<string[]> => {
  const prompt = `
    당신은 법률 콘텐츠 시각화 감독입니다. 다음 법률 텍스트를 분석하여 내용을 가장 잘 표현하는 8개의 장면을 기획하세요.
    
    [텍스트]: ${text}

    [요구사항]:
    1. 8개의 장면을 한국어로 묘사 (사진 촬영 지시문 형태).
    2. 스타일: 실사, 다큐멘터리, 한국적 배경.
    3. 금기: 이미지 내 텍스트 포함 금지.
    
    [출력]: JSON 배열 (scenes: string[])
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["scenes"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      return Array.from({ length: 8 }, () => "법정의 정적인 분위기");
    }

    const result = JSON.parse(textOutput);
    const scenes = (result && typeof result === 'object' && Array.isArray(result.scenes)) 
      ? result.scenes 
      : [];
    
    // 정확히 8개를 맞춤 (부족하면 기본값으로 채움)
    return Array.from({ length: 8 }, (_, i) => scenes[i] || "법정의 정적인 분위기");
  } catch (error) {
    console.error("Analysis failed:", error);
    // 실패 시 사용자 경험을 위해 최소한의 기본 장면 리스트 반환
    return Array.from({ length: 8 }, () => "법률 문서와 정적인 법정 풍경");
  }
};

/**
 * 나노 바나나(gemini-2.5-flash-image)를 사용하여 이미지를 생성합니다.
 */
export const generateSingleImage = async (sceneDescription: string, tonePrompt: string): Promise<string> => {
  const finalPrompt = `${tonePrompt}\n\n[Scene]: ${sceneDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    // optional chaining(?.)을 사용하여 안전하게 접근하고 타입 가드 적용
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const imageData = part?.inlineData?.data;

    if (typeof imageData === 'string') {
      return imageData;
    }
    
    throw new Error("Invalid or missing image data in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};