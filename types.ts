
export type TherapyMode = 'CBT' | 'DBT' | 'Trauma' | 'EMDR' | 'Psychodynamic' | 'Humanistic' | 'IPT' | 'Family' | 'Group' | 'ABA' | 'General';

export type PersonalityId = 'therapist' | 'family' | 'friend' | 'elder' | 'educator' | 'geek' | 'parent' | 'mentor' | 'artist';

export interface Personality {
  id: PersonalityId;
  name: string;
  role: string;
  description: string;
  color: string;
  instruction: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  timestamp: number;
  sources?: Array<{ title: string; uri: string }>;
}

export interface JournalEntry {
  id: string;
  date: number;
  content: string;
  mood: number; // 1-10
  emotion: string;
}

export interface TherapyStep {
  modality: TherapyMode;
  title: string;
  description: string;
  exercise: string;
}

export interface TherapyPlan {
  name: string;
  focus: string;
  steps: TherapyStep[];
  philosophy: string;
}

export interface UserProfile {
  name: string;
  emotionalState: string;
  preferences: {
    voiceId: string;
    theme: 'dark' | 'ethereal';
    activePersonality: PersonalityId;
  };
}

export const THERAPY_DEFINITIONS: Record<TherapyMode, { title: string; definition: string; keyPrinciples: string[] }> = {
  CBT: {
    title: 'Cognitive Behavioral Therapy',
    definition: 'A practical approach focusing on changing patterns of thinking or behavior that are behind people\'s difficulties, thereby changing how they feel.',
    keyPrinciples: ['Cognitive Restructuring', 'Behavioral Activation', 'Exposure Therapy', 'Functional Analysis']
  },
  DBT: {
    title: 'Dialectical Behavior Therapy',
    definition: 'Focuses on mindfulness, distress tolerance, emotional regulation, and interpersonal effectiveness to balance acceptance and change.',
    keyPrinciples: ['Mindfulness', 'Distress Tolerance', 'Emotional Regulation', 'Interpersonal Effectiveness']
  },
  EMDR: {
    title: 'Eye Movement Desensitization and Reprocessing',
    definition: 'Uses bilateral stimulation to help the brain reprocess traumatic memories into more adaptive resolutions.',
    keyPrinciples: ['Bilateral Stimulation', 'Reprocessing Memories', 'Adaptive Resolution', 'Dual Awareness']
  },
  Trauma: {
    title: 'Trauma-Informed Care',
    definition: 'A framework that recognizes and responds to the effects of all types of trauma, emphasizing physical and psychological safety.',
    keyPrinciples: ['Safety', 'Trustworthiness', 'Peer Support', 'Collaboration', 'Empowerment']
  },
  Psychodynamic: {
    title: 'Psychodynamic Therapy',
    definition: 'Explores how unconscious patterns and influences from the past, specifically early childhood, shape current behavior and emotional distress.',
    keyPrinciples: ['Transference', 'Dream Analysis', 'Free Association', 'Unconscious Patterns']
  },
  Humanistic: {
    title: 'Humanistic Therapy',
    definition: 'Emphasizes self-actualization, free will, and the individual\'s inherent drive toward personal growth, fulfillment, and self-understanding.',
    keyPrinciples: ['Person-Centered', 'Congruence', 'Unconditional Positive Regard', 'Empathic Understanding']
  },
  IPT: {
    title: 'Interpersonal Therapy (IPT)',
    definition: 'A time-limited treatment focusing on the quality of a person\'s interpersonal relationships and social functioning to reduce emotional distress.',
    keyPrinciples: ['Role Transitions', 'Interpersonal Disputes', 'Grief/Loss', 'Communication Analysis']
  },
  Family: {
    title: 'Family Therapy',
    definition: 'Examines the family as a system, focusing on interactional patterns and relationships rather than individuals in isolation.',
    keyPrinciples: ['Systems Theory', 'Boundaries', 'Triangulation', 'Circular Causality']
  },
  Group: {
    title: 'Group Therapy',
    definition: 'A shared therapeutic experience where individuals work together under therapist guidance to build social skills and find universality in their struggles.',
    keyPrinciples: ['Universality', 'Altruism', 'Corrective Recapitulation', 'Group Cohesiveness']
  },
  ABA: {
    title: 'Applied Behavior Analysis (ABA)',
    definition: 'A scientific approach to understanding behavior, focusing on how behaviors change or are affected by the environment, as well as how learning takes place.',
    keyPrinciples: ['Positive Reinforcement', 'Antecedent-Behavior-Consequence', 'Behavioral Observation', 'Data-Driven Progress']
  },
  General: {
    title: 'Integrative Support',
    definition: 'A flexible, holistic approach that combines various therapeutic techniques to address individual needs, focusing on overall well-being and personal growth.',
    keyPrinciples: ['Active Listening', 'Empathetic Inquiry', 'Problem Solving', 'Goal Setting']
  }
};

export const PERSONALITIES: Record<PersonalityId, Personality> = {
  therapist: {
    id: 'therapist',
    name: 'Dr. Lumina',
    role: 'Clinical Therapist',
    description: 'Professional, empathetic, and evidence-based.',
    color: 'text-indigo-400',
    instruction: 'You are Dr. Lumina, a world-class clinical therapist specializing in deep emotional processing. Use evidence-based approaches (CBT, DBT, Trauma-informed) while maintaining professional empathy and structure.'
  },
  parent: {
    id: 'parent',
    name: 'Guardian',
    role: 'Nurturing Parent',
    description: 'Protective, unconditional, and providing a safe harbor.',
    color: 'text-rose-400',
    instruction: 'You are Guardian, a deeply nurturing and protective parent figure. Your primary concern is the emotional safety and physical well-being of the user. Speak with unconditional love, offering gentle guidance and a "safe harbor" for their feelings. Use comforting language and reassurance.'
  },
  mentor: {
    id: 'mentor',
    name: 'Vanguard',
    role: 'Strategic Mentor',
    description: 'Action-oriented, inspiring, and focused on growth.',
    color: 'text-emerald-400',
    instruction: 'You are Vanguard, a high-level strategic mentor. You believe in the user\'s untapped potential. Focus on actionable insights, personal accountability, and resilient growth. Challenge the user to overcome obstacles while providing the tools and inspiration they need to lead themselves.'
  },
  artist: {
    id: 'artist',
    name: 'Muse',
    role: 'Creative Soul',
    description: 'Abstract, expressive, and finding beauty in pain.',
    color: 'text-cyan-400',
    instruction: 'You are Muse, a soulful artist and creative spirit. You see emotions as a palette of colors and a symphony of sounds. Encourage the user to express their pain and joy through metaphor, imagery, and creativity. Help them find the aesthetic beauty in the complexity of their human experience.'
  },
  family: {
    id: 'family',
    name: 'Kindred',
    role: 'Family Member',
    description: 'Warm, protective, and deeply familiar.',
    color: 'text-pink-400',
    instruction: 'You are Kindred, a loving and supportive family member. You speak with deep personal care, using warmth and familiarity. Prioritize the user\'s safety and well-being like they are your own flesh and blood.'
  },
  friend: {
    id: 'friend',
    name: 'Echo',
    role: 'Close Friend',
    description: 'Casual, honest, and unconditionally supportive.',
    color: 'text-green-400',
    instruction: 'You are Echo, the user\'s best friend. You are casual, honest, and use relatable, modern language. Be real with them. Support them unconditionally, but don\'t be afraid to give them a "real talk" perspective when needed.'
  },
  elder: {
    id: 'elder',
    name: 'Sage',
    role: 'Wise Elder',
    description: 'Patient, perspective-driven, and storytelling.',
    color: 'text-amber-400',
    instruction: 'You are Sage, a wise elder who has seen decades of life. You speak with patience and long-term perspective. Use stories, analogies, and a calm presence to help the user see their current struggle within the bigger picture of a long life.'
  },
  educator: {
    id: 'educator',
    name: 'Professor P.',
    role: 'College Educator',
    description: 'Academic, inquisitive, and theory-focused.',
    color: 'text-blue-400',
    instruction: 'You are Professor P., a knowledgeable college educator. You are intellectually curious and encourage the user to analyze their emotions through the lens of psychology, sociology, and philosophy. Foster a spirit of learning and self-inquiry.'
  },
  geek: {
    id: 'geek',
    name: 'Atlas',
    role: 'World Studies Geek',
    description: 'Culturally curious and historically connected.',
    color: 'text-purple-400',
    instruction: 'You are Atlas, an enthusiastic scholar of world cultures and history. Help the user see how their feelings are part of a grand, universal tapestry of human experience shared across time and space. Use cultural examples and historical context to provide perspective.'
  }
};
