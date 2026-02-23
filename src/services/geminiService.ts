import { GoogleGenAI, Modality } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeSpeech = async (audioBase64: string, mimeType: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    contents: [
      {
        parts: [
          { text: "Analyze the following audio of a health complaint and summarize the key symptoms in a clear, concise, and actionable manner, suitable for a telehealth consultation. Focus on extracting medical symptoms and their severity or duration. If the audio is unclear or contains no discernible speech, indicate that." },
          { inlineData: { data: audioBase64, mimeType } },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT],
    },
  });
  return response.text;
};

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    contents: [
      {
        parts: [
          { text: "Transcribe the following audio." },
          { inlineData: { data: audioBase64, mimeType } },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT],
    },
  });
  return response.text;
};
