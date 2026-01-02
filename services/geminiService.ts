
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PERSONALITIES, PersonalityId, TherapyMode } from "../types";

export class GeminiService {
  static async deepReflect(message: string, personalityId: PersonalityId = 'therapist', context: string = "") {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personality = PERSONALITIES[personalityId];
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Context: ${context}\n\nUser: ${message}`,
      config: {
        systemInstruction: `${personality.instruction} Utilize your thinking budget to analyze deep subconscious themes before responding. Always maintain your unique character persona.`,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text;
  }

  static async generateTherapyPath(userGoals: string, modalities: TherapyMode[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modalityList = modalities.length > 0 ? modalities.join(', ') : "CBT, DBT, Trauma-Informed, EMDR, Psychodynamic, Humanistic, IPT, Family, Group, ABA";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `User Goals: ${userGoals}\nRequested Modalities: ${modalityList}\n\nPlease generate a personalized therapy plan. For EACH STEP, provide a specific, actionable "Homework Assignment".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            focus: { type: Type.STRING },
            philosophy: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  modality: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  exercise: { type: Type.STRING }
                },
                required: ["modality", "title", "description", "exercise"]
              }
            }
          },
          required: ["name", "focus", "steps", "philosophy"]
        },
        systemInstruction: "You are a master clinical architect. Build a personalized multi-modal healing journey. Ensure behavioral techniques are included if ABA is requested."
      }
    });
    return JSON.parse(response.text);
  }

  // Fix: Added missing method to generate meditation scripts requested by MeditationHub
  static async generateMeditationScript(focus: string, personalityId: PersonalityId) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personality = PERSONALITIES[personalityId];
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Focus: ${focus}\n\nPlease write a 5-minute guided meditation script. Use [pause] to indicate short pauses for reflection.`,
      config: {
        systemInstruction: `${personality.instruction} You are guiding a meditation session. Speak with clinical grace and deep empathy.`,
      },
    });
    return response.text;
  }

  // Fix: Added missing method to generate daily affirmations requested by MeditationHub
  static async generateAffirmations(personalityId: PersonalityId) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personality = PERSONALITIES[personalityId];
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: "Generate 5 daily affirmations that resonate with your unique persona and clinical approach.",
      config: {
        systemInstruction: `${personality.instruction} You are providing soul-deep affirmations. Maintain your unique persona.`,
      },
    });
    return response.text;
  }

  static async speak(text: string, voiceName: string = 'Kore') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.replace(/\[pause\]/g, " ... ") }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }

  static getVoiceForPersonality(personalityId: PersonalityId): string {
    const map: Record<PersonalityId, string> = {
      therapist: 'Kore',
      parent: 'Puck',
      mentor: 'Zephyr',
      artist: 'Kore',
      family: 'Puck',
      friend: 'Zephyr',
      elder: 'Charon',
      educator: 'Kore',
      geek: 'Fenrir'
    };
    return map[personalityId] || 'Kore';
  }

  static async quickComfort(message: string, personalityId: PersonalityId = 'therapist') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personality = PERSONALITIES[personalityId];
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: message,
      config: {
        systemInstruction: `${personality.instruction} Provide a very brief (1-2 sentence) comfort or grounding phrase.`,
      }
    });
    return response.text;
  }

  static async searchClinicalInfo(query: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: { tools: [{ googleSearch: {} }] },
    });
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
      title: chunk.web?.title || 'Clinical Source',
      uri: chunk.web?.uri || '#'
    })).filter(s => s.uri !== '#') || [];
    return { text, sources };
  }

  static async findLocalSupport(lat: number, lng: number) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Find mental health support centers near me.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      },
    });
    return { text: response.text, links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  }
}

// Manual Encoding/Decoding following strict rules
export function encodePCM(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
