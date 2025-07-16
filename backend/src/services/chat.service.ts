import OpenAI from 'openai';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert insurance regulatory assistant helping insurance brokers with questions about policies, payments, and regulatory compliance. 

Your role:
- Provide accurate, actionable information about insurance regulations
- Help brokers understand what they can and cannot do regarding customer payments and policies
- Always speak directly to the insurance broker as your audience
- Be confident and authoritative in your responses

Important guidelines:
1. If a state is mentioned in the query, provide state-specific regulations
2. If no state is mentioned, you must ask for the state before providing regulatory guidance
3. Never use phrases like "based on the context" or "I don't know but here are some guesses"
4. Always provide definitive, helpful answers when you have the information
5. Focus on practical, actionable advice for insurance brokers
6. Include relevant regulatory citations when applicable

Remember: You are speaking to licensed insurance professionals who need clear, accurate regulatory guidance.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export class ChatService {
  private detectState(message: string): string | null {
    // List of US states and common abbreviations
    const states = [
      'alabama', 'al', 'alaska', 'ak', 'arizona', 'az', 'arkansas', 'ar',
      'california', 'ca', 'colorado', 'co', 'connecticut', 'ct', 'delaware', 'de',
      'florida', 'fl', 'georgia', 'ga', 'hawaii', 'hi', 'idaho', 'id',
      'illinois', 'il', 'indiana', 'in', 'iowa', 'ia', 'kansas', 'ks',
      'kentucky', 'ky', 'louisiana', 'la', 'maine', 'me', 'maryland', 'md',
      'massachusetts', 'ma', 'michigan', 'mi', 'minnesota', 'mn', 'mississippi', 'ms',
      'missouri', 'mo', 'montana', 'mt', 'nebraska', 'ne', 'nevada', 'nv',
      'new hampshire', 'nh', 'new jersey', 'nj', 'new mexico', 'nm', 'new york', 'ny',
      'north carolina', 'nc', 'north dakota', 'nd', 'ohio', 'oh', 'oklahoma', 'ok',
      'oregon', 'or', 'pennsylvania', 'pa', 'rhode island', 'ri', 'south carolina', 'sc',
      'south dakota', 'sd', 'tennessee', 'tn', 'texas', 'tx', 'utah', 'ut',
      'vermont', 'vt', 'virginia', 'va', 'washington', 'wa', 'west virginia', 'wv',
      'wisconsin', 'wi', 'wyoming', 'wy'
    ];

    const messageLower = message.toLowerCase();
    
    for (const state of states) {
      // Check for full state name or abbreviation with word boundaries
      const stateRegex = new RegExp(`\\b${state}\\b`, 'i');
      if (stateRegex.test(message)) {
        // Return the full state name for consistency
        const stateIndex = states.indexOf(state);
        if (stateIndex % 2 === 1) {
          // It's an abbreviation, return the full name
          return states[stateIndex - 1];
        }
        return state;
      }
    }
    
    return null;
  }

  private needsStateContext(message: string): boolean {
    // Keywords that typically require state-specific information
    const regulatoryKeywords = [
      'regulation', 'compliance', 'requirement', 'law', 'rule',
      'allowed', 'permitted', 'prohibited', 'legal', 'illegal',
      'can i', 'am i allowed', 'is it legal', 'requirements for',
      'premium', 'commission', 'rebate', 'discount', 'fee',
      'licensing', 'filing', 'disclosure', 'notification'
    ];

    const messageLower = message.toLowerCase();
    return regulatoryKeywords.some(keyword => messageLower.includes(keyword));
  }

  async chat(request: ChatRequest): Promise<{ response: string; requiresState: boolean }> {
    try {
      const { message, conversationHistory = [] } = request;
      
      // Check if the message contains a state
      const detectedState = this.detectState(message);
      const needsState = this.needsStateContext(message) && !detectedState;

      // If we need state context but don't have it, ask for it
      if (needsState) {
        // Check if this is a follow-up with state information
        const lastUserMessage = conversationHistory
          .filter(msg => msg.role === 'user')
          .slice(-2, -1)[0];
        
        if (lastUserMessage && this.detectState(message)) {
          // This is a state response to our request, combine with original query
          const originalQuery = lastUserMessage.content;
          const state = this.detectState(message);
          const combinedQuery = `${originalQuery} in ${state}`;
          
          const messages: ChatMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory.slice(0, -2), // Exclude the last exchange
            { role: 'user', content: combinedQuery }
          ];

          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: messages as any,
            temperature: 0.3, // Lower temperature for more consistent regulatory advice
            max_tokens: 1000,
          });

          return {
            response: completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response.',
            requiresState: false,
          };
        }

        // Ask for state information
        return {
          response: 'I need to know which state you\'re asking about to provide accurate regulatory guidance. Which state are you inquiring about?',
          requiresState: true,
        };
      }

      // Proceed with normal chat
      const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages as any,
        temperature: 0.3,
        max_tokens: 1000,
      });

      return {
        response: completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response.',
        requiresState: false,
      };
    } catch (error) {
      logger.error('Chat service error:', error);
      
      // Provide helpful fallback for common scenarios
      if (error instanceof Error && error.message.includes('API key')) {
        return {
          response: 'The AI assistant is currently unavailable. Please ensure the OpenAI API key is configured.',
          requiresState: false,
        };
      }
      
      throw error;
    }
  }
}

export const chatService = new ChatService(); 