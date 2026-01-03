
import { PERSONALITIES, PersonalityId, TherapyMode } from "../types";

export class GeminiService {
  static async deepReflect(message: string, personalityId: PersonalityId = 'therapist', _context: string = "") {
    const personality = PERSONALITIES[personalityId];
    
    // Mock response - in production this would call an AI service
    return `This is a placeholder response from ${personality.name}. The AI integration has been removed. Original message: ${message}`;
  }

  static async generateTherapyPath(userGoals: string, modalities: TherapyMode[]) {
    // Mock response
    return {
      name: "Your Personalized Healing Journey",
      focus: userGoals,
      philosophy: "A holistic approach combining evidence-based practices",
      steps: [
        {
          modality: modalities[0] || "CBT",
          title: "Initial Assessment",
          description: "Understanding your current state and goals",
          exercise: "Keep a daily mood journal"
        }
      ]
    };
  }

  // Fix: Added missing method to generate meditation scripts requested by MeditationHub
  static async generateMeditationScript(focus: string, personalityId: PersonalityId) {
    const personality = PERSONALITIES[personalityId];
    // Mock meditation script
    return `Welcome to this meditation focused on ${focus}. [pause] Close your eyes and breathe deeply. [pause] ${personality.name} is guiding you on this journey. [pause] Continue to breathe and relax.`;
  }

  // Fix: Added missing method to generate daily affirmations requested by MeditationHub
  static async generateAffirmations(personalityId: PersonalityId) {
    const personality = PERSONALITIES[personalityId];
    // Mock affirmations
    return `Affirmations from ${personality.name}:\n1. You are worthy of healing\n2. Your journey matters\n3. Progress, not perfection\n4. You are enough\n5. Growth happens in small steps`;
  }

  static async speak(_text: string, _voiceName: string = 'Kore') {
    // Mock audio data - return empty base64 audio
    return undefined;
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
    const personality = PERSONALITIES[personalityId];
    // Mock comfort response
    return `${personality.name} is here with you. Take a deep breath - you're doing great.`;
  }

  static async searchClinicalInfo(query: string) {
    // Mock clinical search
    const text = `This is a placeholder for clinical information about: ${query}. AI service integration has been removed.`;
    const sources = [
      { title: 'Example Clinical Source', uri: 'https://example.com' }
    ];
    return { text, sources };
  }

  static async findLocalSupport(_lat: number, _lng: number) {
    // Mock support finder
    return { 
      text: 'Mental health support services are available. Please consult local directories for current information.',
      links: [] 
    };
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
