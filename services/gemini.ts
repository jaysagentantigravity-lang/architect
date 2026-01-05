import { GoogleGenAI } from '@google/genai';
import { Message, AIMode } from '../types';
import { SYSTEM_INSTRUCTIONS } from '../constants/prompts';
import { ARCHITECT_TOOLS, RESEARCH_TOOLS } from './tools';

export class GeminiService {
  private ai: GoogleGenAI;
  private modelName = 'gemini-2.0-flash'; 

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async sendMessage(
    history: Message[],
    currentDoc: string,
    userInput: string,
    mode: AIMode,
    file?: { mimeType: string; data: string }
  ): Promise<{ text: string; documentUpdate?: string; suggestions?: string[]; thinking?: string }> {
    
    let systemInstruction = '';
    let tools: any[] = [];

    // Select System Prompt and Tools based on Mode
    switch (mode) {
      case AIMode.ARCHITECT:
        systemInstruction = SYSTEM_INSTRUCTIONS.ARCHITECT(currentDoc);
        tools = ARCHITECT_TOOLS;
        break;
      
      case AIMode.MARKET_ANALYSIS:
        systemInstruction = SYSTEM_INSTRUCTIONS.MARKET_ANALYSIS;
        tools = RESEARCH_TOOLS;
        break;

      case AIMode.TECHNICAL_DEEP_DIVE:
        systemInstruction = SYSTEM_INSTRUCTIONS.TECHNICAL_DEEP_DIVE;
        tools = RESEARCH_TOOLS;
        break;

      case AIMode.DEEP_CREATIVE_RESEARCH:
        systemInstruction = SYSTEM_INSTRUCTIONS.DEEP_CREATIVE_RESEARCH;
        tools = RESEARCH_TOOLS;
        break;

      case AIMode.DEEP_SEARCH:
      default:
        systemInstruction = SYSTEM_INSTRUCTIONS.DEEP_SEARCH;
        tools = RESEARCH_TOOLS;
        break;
    }

    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }] // Strip previous meta-data for cleaner context
      })),
      {
        role: 'user',
        parts: file 
          ? [
              { inlineData: { mimeType: file.mimeType, data: file.data } },
              { text: userInput }
            ]
          : [{ text: userInput }]
      }
    ];

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        config: {
          systemInstruction,
          tools,
        },
        contents,
      });

      const result = { 
        text: '', 
        documentUpdate: undefined as string | undefined,
        suggestions: undefined as string[] | undefined,
        thinking: undefined as string | undefined
      };

      let rawText = '';
      if (response.text) {
        rawText = response.text;
      }

      // Parse <thinking> tags
      const thinkingMatch = rawText.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch) {
        result.thinking = thinkingMatch[1].trim();
        // Remove the thinking block from the final text displayed to the user
        result.text = rawText.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
      } else {
        result.text = rawText;
      }

      // Extract Function Calls (Only relevant for Architect Mode)
      const functionCalls = response.functionCalls;
      if (functionCalls) {
        // Handle Document Update
        const updateCall = functionCalls.find(fc => fc.name === 'updateDocument');
        if (updateCall) {
          const args = updateCall.args as any;
          if (args.content) {
            result.documentUpdate = args.content;
          }
        }

        // Handle Suggestions
        const suggestCall = functionCalls.find(fc => fc.name === 'suggestNextSteps');
        if (suggestCall) {
          const args = suggestCall.args as any;
          if (args.options && Array.isArray(args.options)) {
            result.suggestions = args.options;
          }
        }
      }

      return result;

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}