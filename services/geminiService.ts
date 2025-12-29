
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
        systemInstruction: `${personality.instruction} Additionally, utilize your deep thinking capabilities to analyze underlying patterns before responding. Stay in character at all times.`,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text;
  }

  static async generateTherapyPath(userGoals: string, modalities: TherapyMode[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modalityList = modalities.length > 0 ? modalities.join(', ') : "CBT, DBT, Trauma-Informed, EMDR, Psychodynamic, Humanistic, IPT, Family, Group";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `User Goals: ${userGoals}\nRequested Modalities: ${modalityList}\n\nPlease generate a personalized therapy plan. For EACH STEP, you MUST provide a specific, actionable "Homework Assignment" in the exercise field. This homework should be a concrete task the user can perform in their daily life.`,
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
                  modality: { type: Type.STRING, description: "One of the requested modalities: CBT, DBT, Trauma, EMDR, Psychodynamic, Humanistic, IPT, Family, or Group" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  exercise: { type: Type.STRING, description: "A detailed homework assignment for the user to complete." }
                },
                required: ["modality", "title", "description", "exercise"]
              }
            }
          },
          required: ["name", "focus", "steps", "philosophy"]
        },
        systemInstruction: "You are a master clinical architect. Create a multi-modal therapy path tailored to the user's specific challenges using the requested therapeutic techniques. Every exercise MUST be an actionable homework assignment."
      }
    });
    return JSON.parse(response.text);
  }

  static async generateMeditationScript(focus: string, personalityId: PersonalityId = 'therapist') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personality = PERSONALITIES[personalityId];
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a 5-minute guided meditation script focusing on: ${focus}`,
      config: {
        systemInstruction: `${personality.instruction} Write a soothing, present-moment meditation script in your specific voice. Include periodic pauses marked as [pause]. Keep the tone ethereal and grounding.`
      }
    });
    return response.text;
  }

  static async generateAffirmations(personalityId: PersonalityId = 'therapist') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personality = PERSONALITIES[personalityId];
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 powerful, short, and uplifting personal affirmations.`,
      config: {
        systemInstruction: `${personality.instruction} You are providing short affirmations to the user. Make them deeply personal, encouraging, and brief. Use your specific voice and tone. Separate each with a newline and include [pause] between them for audio pacing.`
      }
    });
    return response.text;
  }

  static async quickComfort(message: string, personalityId: PersonalityId = 'therapist') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personality = PERSONALITIES[personalityId];
    
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: message,
      config: {
        systemInstruction: `${personality.instruction} Provide a very brief (1-2 sentence) grounding exercise or comfort phrase in your specific voice.`,
      }
    });
    return response.text;
  }

  static async searchClinicalInfo(query: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find clinical evidence or detailed explanations for: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
      title: chunk.web?.title || 'Resource',
      uri: chunk.web?.uri || '#'
    })).filter(s => s.uri !== '#') || [];

    return { text, sources };
  }

  static async findLocalSupport(lat: number, lng: number) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Find high-quality trauma-informed therapy centers or support groups near me.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });
    return {
      text: response.text,
      links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
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
}

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
  for (let i = 0; i < binaryString.length; i++) {
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
  // Use byteOffset and byteLength to ensure alignment for Int16Array (2 bytes per element)
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
