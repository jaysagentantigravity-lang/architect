export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudio?: boolean; // If message was transcribed from audio
  suggestions?: string[]; // Smart UI chips for user selection
  thinking?: string; // Internal monologue/reasoning process
}

export interface DocumentState {
  content: string;
  version: number;
  lastUpdated: Date;
}

export interface ToolCallResponse {
  functionResponses: {
    name: string;
    response: object;
  }[];
}

export enum AppMode {
  TEXT = 'TEXT',
  LIVE = 'LIVE'
}

export enum AIMode {
  ARCHITECT = 'ARCHITECT',
  DEEP_SEARCH = 'DEEP_SEARCH',
  MARKET_ANALYSIS = 'MARKET_ANALYSIS',
  TECHNICAL_DEEP_DIVE = 'TECHNICAL_DEEP_DIVE',
  DEEP_CREATIVE_RESEARCH = 'DEEP_CREATIVE_RESEARCH'
}